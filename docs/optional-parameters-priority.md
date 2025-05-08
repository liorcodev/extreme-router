### Note on Optional Parameters and Priority

The interaction between optional parameters (`:name?`) and subsequent segments is governed by plugin priorities during the matching process. Consider a route like `/prefix/:optional?/nextSegment` and a URL like `/prefix/value`.

When the router encounters the `value` segment after `/prefix`, it looks at the potential nodes registered at that point:

1.  A node representing the optional segment (`:optional?`), handled by the `optionalParam` plugin (priority 600).
2.  A node representing the path _without_ the optional segment (leading directly to `nextSegment`). If `nextSegment` is static, it has the highest priority. If it's dynamic (e.g., `:nextSegment`), it's handled by its corresponding plugin (e.g., `param` with priority 700).

The router compares the priorities of the plugins handling these potential next steps:

- **Case 1: `nextSegment` has higher priority (lower number) than `:optional?`**

  - The router first attempts to match `value` against `nextSegment`.
  - If it matches, the path taken is `/prefix/nextSegment`, effectively skipping the optional parameter logic for this segment.
  - If it _doesn't_ match, the router then attempts to match `value` using the `optionalParam` plugin.

- **Case 2: `:optional?` has higher priority (lower number) than `nextSegment`** (This is the case with built-in `optionalParam` (600) vs `param` (700) or `wildcard` (800)).
  - The router first attempts to match `value` using the higher-priority `optionalParam` plugin.
  - Crucially, the built-in `optionalParam` plugin's matching logic is designed to **always succeed** for the segment it checks. It consumes `value` and assigns it to the `:optional` parameter.
  - The router then proceeds _down the path that includes the optional segment_.
  - It then attempts to match the _next_ segment in the URL against the node _following_ the optional one (i.e., the `nextSegment` node that is a child of the `:optional?` node).
  - If the rest of the URL matches the structure defined _after_ the optional segment, the match succeeds.
  - If the rest of the URL _doesn't_ match (e.g., the URL ends after `value` but the route expected `nextSegment`), the match fails.

**Key Takeaway:** Because the built-in `optionalParam` (priority 600) has a higher priority than `param` (700) and `wildcard` (800), and its matching function always consumes the segment, it will generally "win" the priority check against a subsequent standard parameter or wildcard. The match then _must_ follow the path structure _including_ the optional parameter.

**Revisiting the Example:**

Let's re-analyze the example `/products/:category?/:productId` with this understanding:

```typescript
// ... (import and setup) ...

// Register plugins (lower priority number = higher precedence)
// Order of registration does not matter for the built-in plugins, but it's good practice to register them in a logical order.
router.use(optionalParam); // Priority 600
.use(param); // Priority 700

// Route: /products/:category?/:productId
router.register('/products/:category?/:productId').name = 'GetProduct';

// Matching /products/books/987:
// - After /products, encounter 'books'.
// - Potential next nodes: ':category?' (optionalParam, 600) and ':productId' (param, 700 - representing the path without the optional).
// - optionalParam (600) has higher priority.
// - optionalParam matches and consumes 'books' for :category.
// - Router proceeds down the optional path. Expects ':productId' next.
// - Encounters '987'. Matches ':productId' (using param plugin).
// - End of URL, end of path. Success.
console.log(router.match('/products/books/987'));
// { name: 'GetProduct', params: { category: 'books', productId: '987' } } // Correct based on priority logic.

// Matching /products/654:
// - After /products, encounter '654'.
// - Potential next nodes: ':category?' (optionalParam, 600) and ':productId' (param, 700).
// - optionalParam (600) has higher priority.
// - optionalParam matches and consumes '654' for :category.
// - Router proceeds down the optional path. Expects ':productId' next.
// - No more segments in the URL.
// - Match fails because the path requires ':productId' after ':category'.
console.log(router.match('/products/654'));
// null // Corrected: optionalParam (higher priority) consumes '654' for :category, then fails as :productId is missing.
```
