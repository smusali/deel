# Mini Backend Version of Contractor Platform

💫 Welcome! 🎉

## Data Models

> **All models are defined in src/model.js**

### Profile

- A profile can be either an `admin` ,`client` or `contractor`.
- Clients create contracts with contractors.
- Contractor does jobs for clients and get paid.
- Each profile has a balance property.
- Only `admin` has negative `id`s

### Contract

- A contract is always between `client` and `contractor`.
- Contracts have 3 statuses: `new`, `in_progress`, `terminated`.
- Contracts are considered active only when their statuses are `in_progress` and `new`.
- Contracts group jobs within them.

### Job

- Contractor gets paid for jobs by clients under a certain contract.

## How To

The application requires `Node.js v16`.

### How to Run the Server

Follow the steps below:

1. Fork the upstream repo to create your own repo. This repo is called the origin repo.
2. Clone the origin repo to create a working directory on your local machine.
3. `npm run clean` to make sure no remnants have been left.
4. `npm ci --production` to install all the `npm` packages necessary for running the server.
5. `npm run seed` to populate the `sqlite3` database with the pre-configured data.
    - **Warning**: This will drop the database if it exists
    - **Note**: The database lives in a local file `database.sqlite3`.
6. `npm start` to start the server.
    - **Note**: It is currently using the port `3001`. Make sure it is being used by anything else.

### How to Test the Changes

Follow the steps below:

1. Fork the upstream repo to create your own repo. This repo is called the origin repo.
2. Clone the origin repo to create a working directory on your local machine.
3. `npm run clean` to make sure no remnants have been left.
4. `npm ci` to install all the `npm` packages.
5. Make the changes.
6. `npm run lint-fix` to ensure you fix the linting issues in your changes.
7. `npm test` to test your changes.

## Technical Notes

### Running Server

- The server is running with [nodemon](https://nodemon.io/) which will automatically restart for you when you modify and save a file.
- The server is running on port 3001.

### DB

- The database provider is SQLite, which will store data in a file local to your repository called `database.sqlite3`. 
- The ORM [Sequelize](http://docs.sequelizejs.com/) is on top of it.
- You should only have to interact with Sequelize.

### Authentication

- To authenticate users use the `getProfile` middleware that is located under `src/middleware/getProfile.js`.
- Users are authenticated by passing `profile_id` in the request header.
- After a user is authenticated his profile will be available under `req.profile`. 
- Ensure only users that are on the contract can access their contracts.

## API Endpoints

Below is a list of the implemented API endpoints:

1. `GET /contracts/:id` - retrieves the contract only if it belongs to the profile calling.

2. `GET /contracts` - retrieves a list of _non-terminated_ contracts belonging to the profile calling, which is a user (client or contractor)

3. `GET /jobs/unpaid` - retrieves all unpaid jobs belonging to only _active_ contracts for the profile calling, which is a user (client or contractor)

4. `POST /jobs/:job_id/pay` - pays for the job if it belongs to the profile calling.

**Note**:
- A client can only pay if his/her balance >= the amount to pay.
- The amount should be moved from the client's balance to the contractor balance.

5. `POST /balances/deposit/:userId` - deposits money into the the the balance of a client if a client is the profile calling.

**Note**:
- A client can't deposit more than 25% his total of jobs to pay at the time of the deposit.

6. `GET /admin/best-profession?start=<date>&end=<date>` - retrieves the profession that earned the most money, which is the sum of all his/her paid jobs, for any contactor that he/she worked during the given time period.

**Note**:
- Only admin can retrieve this information.

7. `GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>` - retrieves the clients that paid the most during the given time period

**Note**:
- Only admin (`profile_id` < 0) can retrieve this information.
- Default `limit` is 2.

## TO BE DONE

This package requires to go through several improvements of different kinds:

### Backend

1. **Modularization**: [Split the Implementation](https://github.com/smusali/deel/issues/1)

There is considerable repeated logic in implementing the endpoints, which can be detached and encapsulated in separate libraries. This way, we can create unit tests to test the functionalities. This will increase the readability, cleanliness, and maintainability of the code.

2. **Caching**: [Introduce Caches](https://github.com/smusali/deel/issues/2)

We all know database calls are expensive; however, with the introduction of `Redis` or any other temporary memory storage for caching, the results obtained from `SQLite` will optimize the performance of the whole service.

3. **Error Handling**: [Improve Error Handling](https://github.com/smusali/deel/issues/3)

 With the current seed data, the API endpoint implementation works, but it hasn't covered edge cases such as `500: Server Errors`; most of the calls must be covered with `Try..Catch` calls.

4. **CRUD**: [Introduce New API Endpoints](https://github.com/smusali/deel/issues/4)

This API requires having CRUD endpoints to manage better `Jobs`, `Profiles`, and `Contracts` as well as `Balances` and `Professions`.

5. **Authentication**: [Introduce Auth Mechanism](https://github.com/smusali/deel/issues/5)

This API requires proper authentication, such as tokens and passwords. Currently, there is no specific authentication that has been implemented. Identification of the user comes from the `profile_id` header, which is highly insecure.

6. **Rate Limiting**: [Limit the API Calls](https://github.com/smusali/deel/issues/6)

It may be the least important feature for  #now, but we can implement a rate-limiting mechanism inside the middleware.

### Frontend

1. **Web Page**: [Web UI to Interact with API](https://github.com/smusali/deel/issues/7)

A simple Web Page can be built to interact with API Endpoints.

### DevOps

1. **Versioning**: [Tag & Version](https://github.com/smusali/deel/issues/8)

Currently, there is no versioning that has been set up. Using the version information located inside `package.json`, versioning can be automated for `Docker` images and the `NPM` package itself. `GitHub Tags` is something to consider here.

2. **Releases**: [Release into NPM, GitHub, and Docker Hub](https://github.com/smusali/deel/issues/9)

After proper versioning, `GitHub Actions` CI can be configured to make proper releases into `NPM`, `Docker Hub`, and `GitHub Releases`.

3. **Templates**: [Template Issues & Pull Requests](https://github.com/smusali/deel/issues/10)

To get contributions documented well and consistently, we need to create `ISSUE_TEMPLATE` and `PULL_REQUEST_TEMPLATE`.

4. **Microservicing**: [Kube the API](https://github.com/smusali/deel/issues/11)

Since this is an application running with port `3001`, let's create a microservice by firing up a K8s YAML Configuration.

5. **Cross-Node**: [Support Higher Node.js Versions](https://github.com/smusali/deel/issues/12)

This application currently supports `Node.js v16` but should also support the higher versions.

### Documentation

1. **JSDocs**: [Document the JS](https://github.com/smusali/deel/issues/13)

There is a tremendous amount of code in JS which requires proper [JSDocs](https://jsdoc.app/) documentation. Once the appropriate documentation is done, the `jsdoc` command must be added to `package.json` to generate the documentation in `HTML` and `MarkDown` format and store it inside the `./docs/` folder. Additionally, creating `GET /documentation` might be helpful for the users to understand how to interact with the endpoints.

### Style

1. **TS**: [Enforce Types](https://github.com/smusali/deel/issues/14)

Bringing `TypeScript` will create a new style and reduce the need to check for specific variables and field types. It will optimize the performance and development time and enforce consistent, well-structured, and well-styled coding practices.

2. **Commits**: [Introduce Conventional Commits](https://github.com/smusali/deel/issues/15)

Introducing [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) will enforce consistent, well-structured, and well-styled practices for writing commit messages and bodies and pushing them to the remote branch.

## Contributing

### Process

We use a fork-and-PR process, also known as a triangular workflow. This process
is fairly common in open-source projects. Here's the basic workflow:

1. Fork the upstream repo to create your own repo. This repo is called the origin repo.
2. Clone the origin repo to create a working directory on your local machine.
3. Work your changes on a branch in your working directory, then add, commit, and push your work to your origin repo.
4. Submit your changes as a PR against the upstream repo. You can use the upstream repo UI to do this.
5. Maintainers review your changes. If they ask for changes, you work on your
   origin repo's branch and then submit another PR. Otherwise, if no changes are made,
   then the branch with your PR is merged to upstream's main trunk, the main branch.

When you work in a triangular workflow, you have the upstream repo, the origin
repo, and then your working directory (the clone of the origin repo). You do
a `git fetch` from upstream to local, push from local to origin, and then do a PR from origin to
upstream&mdash;a triangle.

If this workflow is too much to understand to start, that's ok! You can use
GitHub's UI to make a change, which is autoset to do most of this process for
you. We just want you to be aware of how the entire process works before
proposing a change.

Thank you for your contributions; we appreciate you!

### License

Note that we use a standard [MIT](./LICENSE) license on this repo.

### Coding style

Code style is enforced by [`eslint`]('https://eslint.org'). Linting is applied CI builds when a pull request
is made.

### Questions?

The easiest way to get our attention is to comment on an existing, or open a new
[issue]('https://github.com/smusali/deel/issues').
