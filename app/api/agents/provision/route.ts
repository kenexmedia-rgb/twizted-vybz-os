import { NextRequest, NextResponse } from 'next/server';
import { getSessionScope, requireSession } from '@/lib/auth';
import {
  AgentProvisionError,
  provisionAgentsFromPackage
} from '@/lib/agents/provision';
import { supabaseAdmin } from '@/lib/supabase';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const packageKey = requiredText(body?.packageKey);
  const organizationId = requiredText(body?.organizationId);
  const companyId =
    body?.companyId === null ? null : requiredText(body?.companyId);
  const userId = requiredText(body?.userId);

  if (
    !packageKey ||
    !organizationId ||
    !UUID_PATTERN.test(organizationId) ||
    (companyId !== null && !UUID_PATTERN.test(companyId)) ||
    !userId ||
    !UUID_PATTERN.test(userId)
  ) {
    return NextResponse.json(
      {
        error:
          'packageKey, organizationId, companyId (uuid or null), and userId are required'
      },
      { status: 400 }
    );
  }

  const [scope, callerProfileResult, targetProfileResult, companyResult] =
    await Promise.all([
      getSessionScope(auth.user.id),
      supabaseAdmin
        .from('users')
        .select('id, organization_id, company_id')
        .eq('user_id', auth.user.id)
        .single(),
      supabaseAdmin
        .from('users')
        .select('id, organization_id, company_id')
        .eq('id', userId)
        .single(),
      companyId
        ? supabaseAdmin
            .from('companies')
            .select('id, organization_id')
            .eq('id', companyId)
            .single()
        : Promise.resolve({ data: null, error: null })
    ]);

  if (!scope || callerProfileResult.error || !callerProfileResult.data) {
    return NextResponse.json(
      { error: 'User profile not found for this session' },
      { status: 403 }
    );
  }

  const targetProfile = targetProfileResult.data;
  const company = companyResult.data;
  const callerBelongsToOrganization =
    scope.organization_id === organizationId;
  const callerHasCompanyAccess =
    scope.can_switch_company ||
    (scope.user_type === 'salespro'
      ? companyId === null && callerProfileResult.data.id === userId
      : scope.company_id === companyId);
  const targetBelongsToOrganization =
    !targetProfileResult.error &&
    targetProfile?.organization_id === organizationId;
  const companyBelongsToOrganization =
    companyId === null ||
    (!companyResult.error && company?.organization_id === organizationId);

  if (
    !callerBelongsToOrganization ||
    !callerHasCompanyAccess ||
    !targetBelongsToOrganization ||
    !companyBelongsToOrganization
  ) {
    return NextResponse.json(
      { error: 'Organization or company access denied' },
      { status: 403 }
    );
  }

  try {
    const summary = await provisionAgentsFromPackage(packageKey, {
      organizationId,
      companyId,
      userId
    });

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof AgentProvisionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.code === 'package_not_found' ? 404 : 422 }
      );
    }

    return NextResponse.json(
      {
        error: 'agent_provision_failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
