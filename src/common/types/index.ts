/**
 * Common Type Definitions
 */

import { Types } from 'mongoose';

// Pagination Types
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Response Types
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

// Query Filter Types
export interface QueryFilter {
  search?: string;
  status?: string;
  userId?: string;
  orderId?: string;
  categoryId?: string;
  brandId?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// File Upload Types
export interface FileUploadOptions {
  maxSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
}

// Database Types
export type ObjectId = Types.ObjectId | string;

