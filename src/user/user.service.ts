import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRepo } from './user.repo';
import { UserRole } from 'src/common/enums/roles.enum';

interface UpdateUserPayload {
  name?: string;
  age?: number;
}

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepo) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      statusCode: 200,
      message: 'Profile fetched successfully',
      data: user,
    };
  }

  async updateProfile(userId: string, payload: UpdateUserPayload) {
    const user = await this.userRepo.findById({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.userRepo.findByIdAndUpdate({
      id: userId,
      update: payload,
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: updated,
    };
  }

  async updateUserRole(adminId: string, userId: string, newRole: UserRole) {
    // Check if admin exists and is actually an admin
    const admin = await this.userRepo.findById({ id: adminId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    const user = await this.userRepo.findById({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from changing their own role
    if (adminId === userId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const updated = await this.userRepo.findByIdAndUpdate({
      id: userId,
      update: { role: newRole },
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: 200,
      message: 'User role updated successfully',
      data: updated,
    };
  }

  async getAllUsers(adminId: string, page?: number, limit?: number) {
    // Check if admin exists and is actually an admin
    const admin = await this.userRepo.findById({ id: adminId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view all users');
    }

    const pageNum = page ? Math.max(1, page) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      this.userRepo.find({
        filter: {},
        options: { skip, limit: limitNum },
      }),
      this.userRepo.find({ filter: {} }).then((res) => res.length),
    ]);

    return {
      statusCode: 200,
      message: 'Users fetched successfully',
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
  }
}
