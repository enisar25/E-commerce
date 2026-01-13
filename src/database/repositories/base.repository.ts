/**
 * Base Repository
 * Abstract base class for all repository implementations
 * Provides common database operations with consistent patterns
 */
import {
  HydratedDocument,
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  /**
   * Find multiple documents
   */
  async find({
    filter = {},
    projection = {},
    options = {},
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T>[]> {
    return this.model.find(filter, projection, options);
  }

  /**
   * Find a single document
   */
  async findOne({
    filter,
    projection = {},
    options = {},
  }: {
    filter: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findOne(filter, projection, options);
  }

  /**
   * Find a document by ID
   */
  async findById({
    id,
    projection = {},
    options = {},
  }: {
    id: string | Types.ObjectId;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findById(id, projection, options);
  }

  /**
   * Create a new document
   */
  async create(doc: Partial<T>): Promise<HydratedDocument<T>> {
    const created = await this.model.create(doc as any);
    return created as HydratedDocument<T>;
  }

  /**
   * Find a document by ID and update it
   */
  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: string | Types.ObjectId;
    update?: UpdateQuery<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  /**
   * Find a document and update it
   */
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update?: UpdateQuery<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  /**
   * Find a document by ID and delete it
   */
  async findByIdAndDelete({
    id,
    options,
  }: {
    id: string | Types.ObjectId;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findByIdAndDelete(id, options);
  }

  /**
   * Find a document and delete it
   */
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<T>;
    options?: QueryOptions<T>;
  }): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndDelete(filter, options);
  }

  /**
   * Count documents matching filter
   */
  async countDocuments(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  /**
   * Check if document exists
   */
  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }
}
