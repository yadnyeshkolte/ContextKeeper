# Contributing to ContextKeeper

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to ContextKeeper. These are just guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [ContextKeeper Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for ContextKeeper. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as much detail as possible.
- **Provide specific examples** to demonstrate the steps.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots** which show you following the defined reproduction steps.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for ContextKeeper, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Provide specific examples** to demonstrate the steps.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.

### Pull Requests

The process described here has several goals:

- Maintain ContextKeeper's quality
- Fix problems that are important to users
- Engage the technical community in working toward the best possible ContextKeeper

Please follow these steps to have your contribution considered by the maintainers:

1.  Follow all instructions in [the template](.github/PULL_REQUEST_TEMPLATE.md)
2.  Follow the [styleguides](#styleguides)
3.  After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing <details><summary>What if the status checks are failing?</summary>If a status check is failing, and you believe that the failure is unrelated to your change, please leave a comment on the pull request explaining why you believe the failure is unrelated. A maintainer will re-run the status check for you. If we conclude that the failure was a false positive, then we will open an issue to track that problem with our status check suite.</details>

## Development Environment Setup

1.  Fork the repository.
2.  Clone your fork: `git clone https://github.com/YOUR-USERNAME/ContextKeeper.git`
3.  Set up the [backend](./README.md#backend-setup) and [frontend](./README.md#frontend-setup) as described in the README.

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider using [Conventional Commits](https://www.conventionalcommits.org/)

### JavaScript Styleguide

- All JavaScript must adhere to [JavaScript Standard Style](https://standardjs.com/).
- Prefer `const` over `let`. `var` should never be used.

### Documentation Styleguide

- Use [Markdown](https://daringfireball.net/projects/markdown).
- Reference classes and methods using backticks.

## Branch Naming Policy

- Feature branches: `feature/description`
- Bug fix branches: `bugfix/description`
- Documentation branches: `docs/description`

## Review Process

- We use CodeRabbit for automated initial reviews.
- At least one human approval is required for merging.
- Ensure all tests pass before requesting a review.
