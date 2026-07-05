import { SetMetadata } from '@nestjs/common';
import { UserRoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleName[]) => SetMetadata(ROLES_KEY, roles);
