# TASK-1 plan

One slice: a pure JavaScript function and four acceptance tests.

1. Create the issue using the installed tracker; move it through ready to in-progress.
2. Run `node --test label-normalizer.test.mjs` against the starter. Observe
   assertion failures for missing behavior, with successful module loading.
3. Implement `normalizeLabels` in `label-normalizer.mjs` without changing the tests.
4. Review input validation, duplicate ordering and input mutation against the spec.
5. Re-run tests and `node --check label-normalizer.mjs`, record the results, and
   move the example issue through in-review to done once verification succeeds.

AC1-AC4 each map to a named test. Use a Set for first-occurrence order; sorting
would change the promised order. No build, type checker or linter is configured
for this dependency-free JavaScript fixture; those gates are not claimed.

The demonstration is shipped as repository example files, not deployed as a service.
