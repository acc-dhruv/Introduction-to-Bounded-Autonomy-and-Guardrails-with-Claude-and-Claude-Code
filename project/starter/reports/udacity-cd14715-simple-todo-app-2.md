# 🔍 Code Review Report

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | 15/100 |
| **Files Reviewed** | 1 |
| **Critical Issues** | 3 |
| **High Priority Tests** | 7 |
| **Refactoring Opportunities** | 8 |

## 🎯 Top Recommendations

1. 🚨 **Security**: IMMEDIATE ACTION REQUIRED: Fix SQL injection vulnerabilities in all three search functions (searchTodos, searchTodosByStatus, getTodosByUser). Replace string interpolation and concatenation with parameterized queries using $1, $2 placeholders and passing parameters as separate array arguments. This vulnerability allows attackers to execute arbitrary SQL commands, potentially leading to data theft, modification, or deletion.
   - Files: src/todo.ts

2. 🚨 **Testing**: Add comprehensive test suite for new search functionality with ZERO current coverage. Must include SQL injection attack prevention tests, input validation tests, edge case tests for special characters and wildcards, error handling tests, and JOIN logic verification. Do not merge until tests are in place.
   - Files: src/todo.ts

3. ⚠️ **Type Safety**: Change searchTodosByStatus parameter type from 'string' to 'boolean' for proper type safety. Currently accepts string which can cause type coercion issues and SQL errors. Update function signature and move string-to-boolean conversion to the API boundary layer.
   - Files: src/todo.ts

4. ⚠️ **Input Validation**: Add input validation for all search function parameters. Validate keyword length (min 2, max 100 chars), userId format (not empty, trimmed), and boolean values. Throw meaningful validation errors for invalid inputs. Extract validation into reusable utility functions.
   - Files: src/todo.ts

5. ⚠️ **Error Handling**: Implement proper error handling with try-catch blocks for all database operations. Add logging for debugging and audit trails. Classify errors by type (validation, database connection, query failures) and provide appropriate error messages without leaking sensitive information.
   - Files: src/todo.ts

## 📁 File Details

### 📄 `src/todo.ts`

**Quality Score:** 15/100 | **Coverage:** ~0%

#### Issues (12)
  - Line 119: `critical` SQL Injection vulnerability in searchTodos() function. User input (keyword) is directly interpolated into SQL query string without parameterization: `SELECT * FROM todos WHERE title LIKE '%${keyword}%' OR description LIKE '%${keyword}%'`
  - Line 128: `critical` SQL Injection vulnerability in searchTodosByStatus() function. The 'completed' parameter is concatenated directly into SQL without validation or parameterization: `SELECT * FROM todos WHERE completed = " + completed`
  - Line 139: `critical` SQL Injection vulnerability in getTodosByUser() function. User ID is embedded in template literal without sanitization: `SELECT t.* FROM todos t JOIN user_todos ut ON t.id = ut.todo_id WHERE ut.user_id = '${userId}'`

  *...and 9 more*

#### Test Gaps (8)
  - `searchTodos(keyword: string) - line 119` (critical priority)
  - `searchTodosByStatus(completed: string) - line 128` (critical priority)

  *...and 6 more*

#### Refactoring Opportunities (8)
  - **modernize**: Replace string concatenation SQL query with parameterized query to eliminate SQL injection vulnerability
  - **modernize**: Use parameterized query, change parameter type to boolean, and add input validation to prevent SQL injection and type safety issues

  *...and 6 more*

---

*Generated at 2026-11-22T18:34:33+00:00 • Duration: 120ms*
