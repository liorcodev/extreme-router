# Error Types

This document lists the error types used by Extreme Router. When an error is thrown, it will correspond to one of these types. Some error messages may include additional context (indicated by `${inline}`).

| Enum Member                                   | Error Message Template                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `StoreIsNotFunction`                          | `Store is not a function: ${inline}`                                         |
| `StoreDoesNotReturnObject`                    | `Store does not return an object: ${inline}`                                 |
| `StoreUnexpected`                             | `Store unexpected error: ${inline}`                                          |
| `PathAlreadyRegistered`                       | `Path already registered: ${inline}`                                         |
| `PluginWithSameIdAlreadyExists`               | `Plugin with same ID already exists: ${inline}`                              |
| `PluginWithSamePriorityAlreadyExists`         | `Plugin with same priority already exists: ${inline}`                        |
| `PluginIsNotFunction`                         | `Plugin is not a function: ${inline}`                                        |
| `PluginDoesNotReturnObject`                   | `Plugin does not return an object: ${inline}`                                |
| `PluginsOptionNotArray`                       | `Plugins option must be an array, got: ${inline}`                            |
| `PluginMissingId`                             | `Plugin missing ID`                                                          |
| `PluginMissingPriority`                       | `Plugin missing priority`                                                    |
| `PluginIdIsNotString`                         | `Plugin ID is not a string: ${inline}`                                       |
| `PluginPriorityIsNotNumber`                   | `Plugin priority is not a number: ${inline}`                                 |
| `PluginMissingSyntax`                         | `Plugin missing syntax`                                                      |
| `PluginSyntaxIsNotString`                     | `Plugin syntax is not a string: ${inline}`                                   |
| `PluginMissingHandler`                        | `Plugin missing handler: ${inline}`                                          |
| `PluginHandlerIsNotFunction`                  | `Plugin handler is not a function: ${inline}`                                |
| `PluginHandlerReturnNullOrUndefinedForSyntax` | `Plugin handler returned null or undefined while matching syntax: ${inline}` |
| `PluginHandlerDoesNotReturnObject`            | `Plugin handler does not return an object: ${inline}`                        |
| `PluginHandlerMissingMatch`                   | `Plugin handler missing match function`                                      |
| `PluginHandlerMatchIsNotFunction`             | `Plugin handler match is not a function: ${inline}`                          |
| `PluginHandlerMatchDoesNotReturnBoolean`      | `Plugin handler match does not return a boolean: ${inline}`                  |
| `PluginUnexpected`                            | `Plugin unexpected error: ${inline}`                                         |
| `PluginDoesNotExist`                          | `Plugin does not exist for: ${inline}`                                       |
| `DynamicSegmentAlreadyExists`                 | `Dynamic segment already exists: ${inline}`                                  |
| `WildcardNotAtEnd`                            | `Wildcard must be at the end of the path`                                    |
| `PathIsEmpty`                                 | `Path cannot be empty`                                                       |

_Note: `${inline}` represents additional context specific to the error instance._
