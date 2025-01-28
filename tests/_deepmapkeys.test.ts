import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import camelCase from "npm:lodash/camelCase.js";
import type { JsonArray, JsonObject } from "../lib/json.ts";
import { deepMapKeys } from "../mod.ts";

Deno.test("Usage example", () => {
  const subject: JsonArray = [
    {
      address: {
        street_name: "43th Main Road St",
      },
      first_name: "John",
      last_name: "Smith",
    },
    {
      address: {
        street_name: "42nd Main Road St",
      },
      first_name: "Jane",
      last_name: "Smith",
    },
  ];
  const expected: JsonArray = [
    {
      address: {
        streetName: "43th Main Road St",
      },
      firstName: "John",
      lastName: "Smith",
    },
    {
      address: {
        streetName: "42nd Main Road St",
      },
      firstName: "Jane",
      lastName: "Smith",
    },
  ];

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assertEquals(result, expected);
});

Deno.test("Throws if the passed value is not a JSON value", () => {
  try {
    assertThrows(
      () => deepMapKeys(new Set(), camelCase, { debug: true }),
      TypeError,
    );
  } catch (e) {
    const error = e as Error;
    assert(error.message, "Invalid argument type received");
  }
});

Deno.test("Throws when passed undefined", () => {
  try {
    assertThrows(
      () => deepMapKeys(undefined, camelCase, { debug: true }),
      TypeError,
    );
  } catch (e) {
    const error = e as Error;
    assertEquals(error.message, "Invalid argument");
  }
});

Deno.test("Throws if there is a circular reference", () => {
  const a: JsonObject = { prop: {} };
  a.prop = a;

  try {
    assertThrows(() => deepMapKeys(a, camelCase, { debug: true }), TypeError);
  } catch (e) {
    const error = e as Error;
    assert(error.message, "Converting circular structure");
  }
});

Deno.test("Discards keys with undefined values", () => {
  const subject: JsonObject = { prop: undefined };
  const expected: JsonObject = {};

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assertEquals(result, expected);
});

Deno.test("Returns the same object when an empty object is passed", () => {
  const subject: JsonObject = {};

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assert(result === subject);
});

Deno.test("Returns the same array when an empty array is passed", () => {
  const subject: JsonArray = [];

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assert(result === subject);
});

Deno.test("Returns the same value when a JSON scalar is passed", () => {
  const scalars = [null, false, true, "some_string", 42];

  scalars.forEach((v, idx) => {
    deepMapKeys(v, camelCase, { debug: true });
    assertEquals(scalars[idx], v);
  });
});

Deno.test("Transforms keys in a JSON object", () => {
  const subject: JsonObject = {
    address: {
      street_name: "Main St",
    },
    first_name: "John",
    last_name: "Doe",
  };
  const expected: JsonObject = {
    address: {
      streetName: "Main St",
    },
    firstName: "John",
    lastName: "Doe",
  };

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assertEquals(result, expected);
});

Deno.test("Processes nested objects keys in JSON arrays", () => {
  const subject: JsonArray = [
    {
      item_name: "Apple",
      item_price: 20,
    },
    [
      {
        l_1: {
          second_level: undefined,
          third_level: true,
        },
      },
    ],
    10,
    null,
    true,
    "foo_bar",
  ];
  const expected: JsonArray = [
    {
      itemName: "Apple",
      itemPrice: 20,
    },
    [
      {
        l1: {
          thirdLevel: true,
        },
      },
    ],
    10,
    null,
    true,
    "foo_bar",
  ];

  const result = deepMapKeys(subject, camelCase, { debug: true });

  assertEquals(result, expected);
});

Deno.test("Skips keys matching a pattern in the skip list for JSON objects", () => {
  const KEY1 = "some-very weird:key";
  const KEY2 = "2024-07-30T05:13:15.416Z";

  const subject: JsonObject = {
    first_key: {
      second_key: {
        third_key: {
          [KEY1]: { item_value: 42 },
        },
        [KEY2]: { item_value: 43 },
      },
    },
  };
  const expected: JsonObject = {
    firstKey: {
      secondKey: {
        thirdKey: {
          [KEY1]: { itemValue: 42 },
        },
        [KEY2]: { itemValue: 43 },
      },
    },
  };

  const result = deepMapKeys(subject, camelCase, {
    skipList: [
      /\$\.first_key\.second_key\.third_key\['some-very weird:key'\]$/,
      /\$\.first_key\.second_key\['2024-07-30T05:13:15\.416Z'\]$/,
    ],
    debug: true,
  });

  assertEquals(result, expected);
});

Deno.test("Skips keys matching a pattern in the skip list for JSON arrays", () => {
  const KEY1 = "some-very weird:key";
  const KEY2 = "2024-07-30T05:13:15.416Z";

  const subject: JsonArray = [{
    first_key: {
      second_key: {
        third_key: {
          [KEY1]: { item_value: 42 },
        },
        [KEY2]: { item_value: 43 },
      },
    },
  }];
  const expected: JsonArray = [{
    firstKey: {
      secondKey: {
        thirdKey: {
          [KEY1]: { itemValue: 42 },
        },
        [KEY2]: { itemValue: 43 },
      },
    },
  }];

  const result = deepMapKeys(subject, camelCase, {
    skipList: [
      /\$\[0\]\.first_key\.second_key\.third_key\['some-very weird:key'\]$/,
      /\$\[0\]\.first_key\.second_key\['2024-07-30T05:13:15\.416Z'\]$/,
    ],
    debug: true,
  });

  assertEquals(result, expected);
});

Deno.test("Skips entries matching the regex list contains an empty string", () => {
  const KEY1 = "some-very weird:key";
  const KEY2 = "2024-07-30T05:13:15.416Z";

  const subject: JsonArray = [{
    first_key: {
      second_key: {
        third_key: {
          [KEY1]: { item_value: 42 },
        },
        [KEY2]: { item_value: 43 },
      },
    },
  }];
  const expected: JsonArray = [{
    firstKey: {
      secondKey: {
        thirdKey: {
          "someVeryWeirdKey": { itemValue: 42 },
        },
        "20240730T051315416Z": { itemValue: 43 },
      },
    },
  }];

  const result = deepMapKeys(subject, camelCase, {
    skipList: [/''/],
    debug: true,
  });

  assertEquals(result, expected);
});

Deno.test("Skips keys that appear as Date's ISO string", () => {
  const subject: JsonArray = [{
    dates_data: {
      "2024-07-30T05:00:00.000Z": { item_value: 42 },
    },
  }];
  const expected: JsonArray = [{
    datesData: {
      "2024-07-30T05:00:00.000Z": { itemValue: 42 },
    },
  }];

  const result = deepMapKeys(subject, camelCase, {
    skipList: [/\['\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z'\]$/], // Date ISO string
    debug: true,
  });

  assertEquals(result, expected);
});

Deno.test("Disposes known references", () => {
  const subject = {
    full_name: "John Smith",
    address: {
      street_name: "43th Main Road St",
    },
  };

  const expected = {
    fullName: "John Smith",
    address: {
      streetName: "43th Main Road St",
    },
  };

  deepMapKeys(subject, camelCase);
  const result = deepMapKeys(subject, camelCase);

  assertEquals(result, expected);
});
