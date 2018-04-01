# aws-saml

Node.js CLI package which allows you to get AWS temporary credentials using a SAML IDP. Inspired by 
[How to Implement a General Solution for Federated API/CLI Access Using SAML 2.0][1]

### Prerequisites

- Node.js v4+
- AWS Command Line Interface (CLI) [configured][2]

### Installation

`npm install -g aws-saml`

### Configuration

* Generate `~/.aws-saml.json` by running `aws-saml login` (first time only)
* Adjust your `~/.aws-saml.json`

### Usage

* Run `aws-saml login`
* Enter a password
* Chose an account
* Use your AWS CLI commands by adding `--profil saml`

> Ex. `aws s3 ls --profil saml`

[1]: https://aws.amazon.com/ru/blogs/security/how-to-implement-a-general-solution-for-federated-apicli-access-using-saml-2-0
[2]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
