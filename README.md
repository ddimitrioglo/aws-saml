# aws-saml

Node.js CLI package which allows you to get AWS temporary credentials using a SAML IDP. 

Inspired by [AWS CLI Access Using SAML 2.0][1] article.

### Prerequisites

- Node.js v4+
- AWS Command Line Interface (CLI) [configured][2]
- AWS SAML Provider configured

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

### Improvements

* If you are facing some issues, please don't hesitate to open an issue
* If you have an idea how to improve this module, feel free to contribute or open an issue with `enhancement` label

We will get back to you as soon as possible.

### License

This repository can be used under the MIT license.
> See [LICENSE][3] for more details.

[1]: https://aws.amazon.com/ru/blogs/security/how-to-implement-a-general-solution-for-federated-apicli-access-using-saml-2-0
[2]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
[3]: https://github.com/ddimitrioglo/aws-saml/blob/master/LICENSE
