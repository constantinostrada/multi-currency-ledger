/**
 * UuidGenerator — Infrastructure Layer
 *
 * Implements IIdGenerator using UUID v4.
 * The `uuid` package lives here, not in application or domain.
 */

import { v4 as uuidv4 } from "uuid";
import type { IIdGenerator } from "@/application/ports/IIdGenerator";

export class UuidGenerator implements IIdGenerator {
  generate(): string {
    return uuidv4();
  }
}
