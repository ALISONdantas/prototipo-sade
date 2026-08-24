export type LogicalRole = 'PATIENT' | 'PROFESSIONAL' | 'INSTITUTION' | 'RESEARCHER';

interface RoleLike {
  role_code?: string;
}

// Adapter do Backend (role_code da tabela `roles`) para Frontend
// ("PATIENT", "PROFESSIONAL", "INSTITUTION", "RESEARCHER").
export function getLogicalRole(user: RoleLike | null | undefined): LogicalRole {
  const rawRole = (user?.role_code || 'PATIENT').toUpperCase();
  if (rawRole === 'LEITOR' || rawRole === 'ADMIN') return 'PATIENT';
  if (rawRole === 'GESTOR') return 'PROFESSIONAL';
  if (rawRole === 'ANALISTA') return 'RESEARCHER';
  if (rawRole === 'INSTITUTION_MANAGER') return 'INSTITUTION';
  if (rawRole === 'PROFESSIONAL' || rawRole === 'RESEARCHER' || rawRole === 'INSTITUTION') {
    return rawRole;
  }
  return 'PATIENT';
}
