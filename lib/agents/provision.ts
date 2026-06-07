import { supabaseAdmin } from '@/lib/supabase';

export type AgentProvisionContext = {
  organizationId: string;
  companyId: string | null;
  userId: string;
};

export type AgentProvisionSummary = {
  created: number;
  skipped: number;
  provisionedNames: string[];
  skippedNames: string[];
};

export class AgentProvisionError extends Error {
  constructor(
    public readonly code: 'package_not_found' | 'invalid_package',
    message: string
  ) {
    super(message);
    this.name = 'AgentProvisionError';
  }
}

export function agentNameToType(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function provisionAgentsFromPackage(
  packageKey: string,
  context: AgentProvisionContext
): Promise<AgentProvisionSummary> {
  const { data: agentPackage, error: packageError } = await supabaseAdmin
    .from('agent_packages')
    .select('agents')
    .eq('package_key', packageKey)
    .eq('is_active', true)
    .maybeSingle();

  if (packageError) {
    throw packageError;
  }

  if (!agentPackage) {
    throw new AgentProvisionError(
      'package_not_found',
      `Active agent package "${packageKey}" was not found`
    );
  }

  if (
    !Array.isArray(agentPackage.agents) ||
    agentPackage.agents.some(
      (name) => typeof name !== 'string' || !name.trim()
    )
  ) {
    throw new AgentProvisionError(
      'invalid_package',
      `Agent package "${packageKey}" has an invalid agents list`
    );
  }

  const packageAgents = agentPackage.agents.map((name) => ({
    name: (name as string).trim(),
    type: agentNameToType((name as string).trim())
  }));
  const types = packageAgents.map((agent) => agent.type);

  let existingQuery = supabaseAdmin
    .from('agents')
    .select('type')
    .eq('organization_id', context.organizationId)
    .in('type', types);

  existingQuery =
    context.companyId === null
      ? existingQuery.is('company_id', null)
      : existingQuery.eq('company_id', context.companyId);

  const { data: existingAgents, error: existingError } = await existingQuery;

  if (existingError) {
    throw existingError;
  }

  const existingTypes = new Set(
    (existingAgents ?? []).map((agent) => agent.type)
  );
  const provisionedNames: string[] = [];
  const skippedNames: string[] = [];

  for (const agent of packageAgents) {
    if (existingTypes.has(agent.type)) {
      skippedNames.push(agent.name);
      continue;
    }

    const { error: insertError } = await supabaseAdmin.from('agents').insert({
      organization_id: context.organizationId,
      company_id: context.companyId,
      user_id: context.userId,
      name: agent.name,
      type: agent.type,
      config: {},
      is_active: true,
      is_seed: false
    });

    if (insertError?.code === '23505') {
      skippedNames.push(agent.name);
      existingTypes.add(agent.type);
      continue;
    }

    if (insertError) {
      throw insertError;
    }

    provisionedNames.push(agent.name);
    existingTypes.add(agent.type);
  }

  return {
    created: provisionedNames.length,
    skipped: skippedNames.length,
    provisionedNames,
    skippedNames
  };
}
