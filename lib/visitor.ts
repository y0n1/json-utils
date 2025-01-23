import type { JsonArray, JsonObject, JsonScalar } from "./json.ts";
import type { Node } from "./node.ts";

/**
 * Options for configuring the JSON visitor.
 */
export interface VisitorOptions {
  /**
   * An optional array of regular expressions. Keys matching any of these
   * regular expressions will be skipped during the visit.
   * JSONPath notation (RFC 9535) is supported to match against paths of specific object keys.
   */
  skipList?: Array<RegExp>;

  /**
   * An optional flag to enable debug mode.
   * When set to true, each time a node is visited, its JSONPath will be logged.
   */
  debug?: boolean;
}

/**
 * A function type that defines a mutator for object keys.
 *
 * @param keyName - The name of the key to be mutated.
 * @returns The mutated key name.
 */
export type ObjectKeyMutatorFunction = (keyName: string | number) => string;

export class Visitor {
  readonly #onVisitObjectKey: ObjectKeyMutatorFunction;
  readonly #skipList: Array<RegExp>;
  readonly #isDebugEnabled: boolean;

  constructor(
    onVisitJsonObjectKey: ObjectKeyMutatorFunction,
    options?: VisitorOptions,
  ) {
    this.#onVisitObjectKey = onVisitJsonObjectKey;
    this.#skipList = options?.skipList ?? [];
    this.#isDebugEnabled = options?.debug ?? false;
  }

  visitScalar(node: Node<JsonScalar>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }
  }

  visitArray(node: Node<JsonArray>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }

    node.children?.forEach((child) => child.accept(this));
  }

  visitObject(node: Node<JsonObject>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }

    node.children?.forEach((child) => {
      const newKey = this.#skipList.some((regex) => regex.test(child.jsonpath))
        ? child.key
        : this.#onVisitObjectKey(child.key);
      child.key = newKey;
      child.accept(this);
    });
  }
}
