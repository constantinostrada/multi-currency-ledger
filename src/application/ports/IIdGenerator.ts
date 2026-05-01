/**
 * IIdGenerator — Application Port
 *
 * Abstracts ID generation so use cases remain independent of the
 * specific strategy (UUID v4, ULID, database sequence, etc.).
 */

export interface IIdGenerator {
  generate(): string;
}
