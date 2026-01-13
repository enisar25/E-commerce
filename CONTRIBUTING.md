# Contributing Guide

Thank you for considering contributing to this E-Commerce API project! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Follow the project's coding standards

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Error messages or logs

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the coding standards
   - Write clear, descriptive commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Wait for review and feedback

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings (unless double quotes are needed)
- Add trailing commas in objects and arrays
- Use semicolons
- Maximum line length: 100 characters

### File Naming

- Use kebab-case for files: `user.service.ts`
- Use PascalCase for classes: `UserService`
- Use camelCase for variables and functions: `getUserById`

### Project Structure

Follow the existing module structure:
```
module-name/
├── dto/
├── validation/
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.model.ts
├── module-name.repo.ts
└── module-name.module.ts
```

### Validation

- Use Zod schemas for all input validation
- Place schemas in `validation/` directory
- Export schemas from `validation/index.ts`

### Error Handling

- Use appropriate HTTP status codes
- Provide clear error messages
- Log errors appropriately
- Use custom exceptions when needed

### Testing

- Write unit tests for services
- Write integration tests for controllers
- Aim for good test coverage
- Test both success and error cases

## Commit Message Format

Use clear, descriptive commit messages:

```
Add: feature description
Fix: bug description
Update: what was updated
Remove: what was removed
Refactor: what was refactored
Docs: documentation changes
```

Examples:
- `Add: user profile update endpoint`
- `Fix: cart item quantity validation`
- `Update: product model to include discount field`
- `Docs: update API documentation`

## Development Workflow

1. **Create an issue** (for bugs or features)
2. **Get assigned** or assign yourself
3. **Create a branch** from `main`
4. **Make changes** following standards
5. **Test thoroughly**
6. **Update documentation**
7. **Create Pull Request**
8. **Address review feedback**
9. **Merge when approved**

## Testing Guidelines

### Unit Tests

- Test business logic in services
- Mock dependencies
- Test edge cases
- Test error scenarios

### Integration Tests

- Test API endpoints
- Test database operations
- Test authentication/authorization
- Test validation

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## Documentation

- Update README.md if needed
- Update API.md for new endpoints
- Update ARCHITECTURE.md for architectural changes
- Add JSDoc comments for new functions

## Questions?

- Open an issue for questions
- Check existing documentation
- Review existing code for patterns

## Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!

