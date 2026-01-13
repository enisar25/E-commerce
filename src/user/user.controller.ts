import { Controller, Get, Patch, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard,type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return this.userService.getProfile(req.user._id.toString());
  }

  @Patch('profile')
  updateProfile(@Req() req: AuthRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateProfile(req.user._id.toString(), updateUserDto);
  }

  @Patch(':userId/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateUserRole(
    @Req() req: AuthRequest,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.userService.updateUserRole(
      req.user._id.toString(),
      userId,
      updateRoleDto.role,
    );
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllUsers(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.getAllUsers(
      req.user._id.toString(),
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
