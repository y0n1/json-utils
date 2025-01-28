# @y0n1/json-utils

This package provides utilities for deep manipulation of JSON object keys. It is
particularly useful for mapping data types containing key names in one case
format (e.g., snake_case) to another case format (e.g., camelCase). For
instance, if you have a JSON object with keys in snake_case and you want to
convert them to camelCase, the `deepMapKeys` function can handle that
transformation seamlessly.

For more detailed usage and examples, please refer to the
[documentation](https://github.com/y0n1/json-utils).

## Installation

For NodeJS users, you can install the package from the JSR registry by running:

```bash
npx jsr add @y0n1/json-utils
```

More information about this command can be found in the
[JSR docs](https://jsr.io/docs/with/node).

## Usage

Here's a basic example of how to use the package:

```typescript
import { deepMapKeys } from "@y0n1/json-utils";
import camelCase from "lodash/camelCase.js";

interface Address {
  streetName: string;
}

interface UserDetails {
  address: AddressDetails;
  firstName: string;
  lastName: string;
}

/*
 * Assume this data is recevied from an external API.
 * Notice that elements in the externalData array don't match
 * the `UserDetails` interface due to the casing of the object keys.
 */
const externalData = [
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

const transformedData = deepMapKeys(data, camelCase) as Array<UserDetails>;

console.log(transformedData);
// Output:
//
// [
//     {
//       address: {
//         streetName: "43th Main Road St",
//       },
//       firstName: "John",
//       lastName: "Smith",
//     },
//     {
//       address: {
//         streetName: "42nd Main Road St",
//       },
//       firstName: "Jane",
//       lastName: "Smith",
//     },
// ];
```

The `deepMapKeys` function behavior can be configured to skip certain keys deep
in the data structure by using regular expressions that match against the
[JSONPath](https://datatracker.ietf.org/doc/html/rfc9535#name-status-of-this-memo)
of those object keys.

Here is an example from the tests explaining how leverage this feature:

```typescript
Deno.test("should skip keys matching a pattern in the skip list", () => {
  // Assume we don't want to transform these 2 keys
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
    debug: true, // Logs the JSONPath of each key when visited
  });

  assertEquals(result, expected);
});
```
