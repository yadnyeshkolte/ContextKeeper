# ContextKeeper Documentation

Welcome to the ContextKeeper documentation! This directory contains comprehensive guides for developers, users, and contributors.

## 📚 Documentation Index

### Getting Started

- **[Main README](../README.md)** - Start here! Complete overview, installation, and quick start guide
- **[Quick Start Guide](../README.md#-quick-start)** - Get up and running in minutes

### Component Documentation

- **[Backend Documentation](../backend/README.md)** - Express + Python backend architecture, API endpoints, and Python scripts/agents
- **[Frontend Documentation](../frontend/README.md)** - React + Vite + TypeScript frontend, components, and development workflow
- **[Kestra Workflows](../kestra/README.md)** - Workflow orchestration, automation, and deployment

### Developer Resources

- **[Developer Guide](DEVELOPER_GUIDE.md)** - Comprehensive guide for developers with architecture, data flow, and development tasks
- **[Architecture Overview](architecture.md)** - System architecture and design decisions
- **[API Reference](api.md)** - Complete API endpoint documentation
- **[Development Guide](development.md)** - Development setup and best practices

### Operations & Deployment

- **[Deployment Guide](deployment.md)** - Production deployment instructions
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

### Contributing

- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to ContextKeeper
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community guidelines
- **[Security Policy](../SECURITY.md)** - Security vulnerability reporting

## 🎯 Quick Links by Role

### For New Developers

1. Read [Main README](../README.md) for project overview
2. Follow [Installation Guide](../README.md#-installation) to set up your environment
3. Review [Developer Guide](DEVELOPER_GUIDE.md) for architecture and code organization
4. Check [Backend README](../backend/README.md) and [Frontend README](../frontend/README.md) for component-specific details

### For Users

1. Start with [Main README](../README.md)
2. Follow [Quick Start](../README.md#-quick-start)
3. Check [Usage Examples](USAGE_EXAMPLES.md)
4. Refer to [Troubleshooting](troubleshooting.md) if needed

### For DevOps/Deployment

1. Review [Architecture](architecture.md)
2. Follow [Deployment Guide](deployment.md)
3. Configure [Kestra Workflows](../kestra/README.md)
4. Monitor using [API Status Endpoints](api.md#system-status)

## 🏗️ Architecture Overview

ContextKeeper is a multi-tier AI-powered knowledge management system:

- **Frontend**: React + Vite + TypeScript (Port 5173)
- **Backend**: Node.js + Express + Python (Port 3000)
- **Databases**: MongoDB (metadata) + ChromaDB (vectors)
- **Orchestration**: Kestra + Docker (Port 8080)
- **AI**: Hugging Face API (Llama models)

See [Developer Guide](DEVELOPER_GUIDE.md) for detailed architecture diagrams.

## 📖 Documentation Structure

```
docs/
├── README.md                    # This file - Documentation index
├── DEVELOPER_GUIDE.md           # Comprehensive developer guide
├── api.md                       # API reference (placeholder)
├── architecture.md              # Architecture details (placeholder)
├── deployment.md                # Deployment guide (placeholder)
├── development.md               # Development guide (placeholder)
├── troubleshooting.md           # Troubleshooting guide (placeholder)
└── USAGE_EXAMPLES.md            # Usage examples (placeholder)
```

## 🔍 Finding What You Need

**I want to...**

- **Install ContextKeeper** → [Main README Installation](../README.md#-installation)
- **Understand the architecture** → [Developer Guide Architecture](DEVELOPER_GUIDE.md#architecture-overview)
- **Set up development environment** → [Developer Guide Setup](DEVELOPER_GUIDE.md#development-setup)
- **Add a new API endpoint** → [Developer Guide Common Tasks](DEVELOPER_GUIDE.md#adding-a-new-api-endpoint)
- **Create a new React component** → [Frontend README](../frontend/README.md) + [Developer Guide](DEVELOPER_GUIDE.md#adding-a-new-react-component)
- **Write a Python script** → [Backend README](../backend/README.md) + [Developer Guide](DEVELOPER_GUIDE.md#adding-a-new-python-script)
- **Create a Kestra workflow** → [Kestra README](../kestra/README.md) + [Developer Guide](DEVELOPER_GUIDE.md#creating-a-new-kestra-workflow)
- **Deploy to production** → [Deployment Guide](deployment.md)
- **Fix an issue** → [Troubleshooting](troubleshooting.md)
- **Contribute code** → [Contributing Guidelines](../CONTRIBUTING.md)

## 🆘 Getting Help

1. **Check documentation** - Most questions are answered here
2. **Search issues** - [GitHub Issues](https://github.com/yadnyeshkolte/ContextKeeper/issues)
3. **Ask questions** - Open a new issue with the `question` label
4. **Report bugs** - Open an issue with the `bug` label
5. **Request features** - Open an issue with the `enhancement` label

## 📝 Contributing to Documentation

Documentation improvements are always welcome! To contribute:

1. Fork the repository
2. Make your changes
3. Ensure markdown is properly formatted
4. Submit a pull request

See [Contributing Guidelines](../CONTRIBUTING.md) for details.

## 📄 License

Apache 2.0 - See [LICENSE](../LICENSE) for details.

---

**Last Updated**: December 2025  
**Version**: 1.0.0
