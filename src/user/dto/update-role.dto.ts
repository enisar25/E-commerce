import { IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enums/roles.enum';

export class UpdateRoleDto {
  @IsEnum(UserRole, {
    message: 'Role must be one of: CUSTOMER, SELLER, ADMIN',
  })
  role: UserRole;
}

