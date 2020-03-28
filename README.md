# aws-saml

Node.js CLI package which allows you to get AWS temporary credentials using a SAML IDP. 
Inspired by [AWS CLI Access Using SAML 2.0][1] article.

> If you have AWS-SAML configured and you can provide me a minimal access to it please open an issue to get in touch.
> Having such access would help me to continue improving this package and test if it's not broken. Thanks. 

### Prerequisites

- Node.js v4+
- AWS Command Line Interface (CLI) [configured][2]
- AWS SAML Provider configured

### Installation

`npm install -g aws-saml`

### Configuration

`aws-saml configure`

> Or manually add/edit `~/.aws-saml/config.json` which should look like

```text
{
  "profile": "saml",                    # AWS named profile [Required, default: "saml"]
  "username": "myusername",             # SSO username (login or email) [Required]
  "password": false,                    # SSO password (encrypted with SSH keys) [Optional, default: false]
  "directoryDomain": "https://directory.mycorp.com", # Identity provider (aka IdP) [Required] 
  "aliases": {                          # AWS accounts aliases [Optional, default: {}]
    "888999888999": "workAccount",
    ...
  }
}
```

### Usage

* Run `aws-saml login`
* Enter a username & password
* Chose an account
* Use your AWS CLI commands by adding `--profile saml`

> Ex. `aws s3 ls --profile saml`

### Help

To get familiar with all the features, just use `aws-saml --help`

### Todo

* Get rid of `request` as it was deprecated
* Try `AWS.util.iniLoader.resolvedProfiles` (issue #13)

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
