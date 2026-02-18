# Testing Guide

## Current State

The project currently has minimal test coverage. Test infrastructure is in place but needs to be expanded.

## Future Testing Goals

### Unit Tests
- API endpoint tests
- Model conversion logic tests
- Rigging algorithm tests
- Motion capture validation tests

### Component Tests
- React component rendering
- File upload functionality
- Progress tracking
- Error handling

### Integration Tests
- End-to-end upload workflows
- API integration tests
- Database integration (when added)

### E2E Tests
- User workflows
- Multi-step processes
- Cross-browser compatibility

## Running Tests

Currently, the test script is a placeholder:
```bash
npm test
```

To add proper testing:

1. **Install Jest and testing utilities**
```bash
npm install --save-dev jest supertest @testing-library/react @testing-library/jest-dom
```

2. **Update package.json test script**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

3. **Add Jest configuration**
```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"]
  }
}
```

4. **Run tests**
```bash
npm test
```

## Test Files

Current test file:
- `test/api.test.js` - Basic API endpoint tests (needs Jest to run)

## Contributing Tests

When adding new features, please include tests:
- Write tests first (TDD approach)
- Aim for 80%+ code coverage
- Test both success and error cases
- Include edge case testing

## Continuous Integration

For production deployments, add CI/CD with automated testing:

**GitHub Actions example:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Manual Testing Checklist

Until automated tests are complete, manually verify:

- [ ] Photo upload and conversion
- [ ] Model upload and analysis
- [ ] Humanoid detection
- [ ] Rigging process
- [ ] Motion capture upload
- [ ] Motion application to rigged models
- [ ] Default model display
- [ ] API endpoints respond correctly
- [ ] Error handling works
- [ ] File size limits enforced
- [ ] Supported formats work
- [ ] Unsupported formats rejected
- [ ] UI responsive on mobile
- [ ] Progress tracking accurate
- [ ] Multiple concurrent uploads

## Performance Testing

Consider adding:
- Load testing with multiple users
- File upload stress testing
- Memory leak detection
- API response time monitoring

## Security Testing

Important areas to test:
- File upload validation
- XSS prevention
- SQL injection (when DB added)
- Authentication (when added)
- Authorization checks
- Rate limiting
- File size limits
- Malicious file detection
