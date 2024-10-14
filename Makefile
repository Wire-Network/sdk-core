SHELL := /bin/bash

# include .env
# export $(shell sed 's/=.*//' .env)

PACKAGE_NAME := $(shell jq -r .name package.json)
PACKAGE_VERSION := $(shell jq -r .version package.json)
PUBLISH_DATE := $(shell date "+%Y-%m-%d %H:%M:%S")


SRC_FILES := $(shell find src -name '*.ts')
TEST_FILES := $(wildcard test/*.ts)
BIN := ./node_modules/.bin
MOCHA_OPTS := -u tdd -r ts-node/register -r tsconfig-paths/register --extension ts

lib: ${SRC_FILES} package.json tsconfig.json node_modules rollup.config.mjs
	@${BIN}/rollup -c && touch lib

.PHONY: test
test: lib node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' \
		${BIN}/mocha ${MOCHA_OPTS} test/*.ts --grep '$(grep)'

.PHONY: test-coverage
test-coverage: lib node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' \
		${BIN}/nyc --reporter=html \
		${BIN}/mocha ${MOCHA_OPTS} -R nyan test/*.ts

.PHONY: coverage
coverage: test-coverage
	@open coverage/index.html

.PHONY: ci-test
ci-test: lib node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' \
		${BIN}/nyc --reporter=text \
		${BIN}/mocha ${MOCHA_OPTS} -R list test/*.ts

.PHONY: check
check: node_modules
	@${BIN}/eslint src --ext .ts --max-warnings 0 --format unix && echo "Ok"

.PHONY: format
format: node_modules
	@${BIN}/eslint src --ext .ts --fix

test/browser.html: lib $(TEST_FILES) test/rollup.config.mjs node_modules
	@${BIN}/rollup -c test/rollup.config.mjs

.PHONY: browser-test
browser-test: test/browser.html
	@open test/browser.html

node_modules:
	yarn install --non-interactive --frozen-lockfile --ignore-scripts

.PHONY: publish
publish: | distclean node_modules
	@if [ -z "$${NPM_TOKEN}" ]; then echo "NPM token is not set."; exit 1; fi
	@git diff-index --quiet HEAD || (echo "Uncommitted changes, please commit first" && exit 1)
	@git fetch origin && git diff origin/master --quiet || (echo "Changes not pushed to origin, please push first" && exit 1)
	@yarn config set version-tag-prefix "" && yarn config set version-git-message "Version %s"
	@NPM_TOKEN=$${NPM_TOKEN} yarn publish --access restricted --non-interactive 
	@git push && git push --tags
	@curl -X POST -H 'Content-type: application/json' --data '{ "channel": "#npm-notifications","username": "npm bot", "icon_url": "https://static-00.iconduck.com/assets.00/megaphone-emoji-512x390-7a60feky.png","text": "#### New Deployment!\n\n**Package Name:** $(PACKAGE_NAME) \n**Version:** $(PACKAGE_VERSION)   **Published on**: $(PUBLISH_DATE)" }' $(WEBHOOK_URL)

# used for GitHub Deploy Action
.PHONY: ci-publish
ci-publish: | distclean node_modules
	@echo "Publishing package..."
	@if [ -z "$${NODE_AUTH_TOKEN}" ]; then echo "NPM token is not set."; exit 1; fi
	@if [ -z "$${WEBHOOK_URL}" ]; then echo "WEBHOOK_URL is not set."; exit 1; fi
	@npm publish --access restricted --non-interactive
	@curl -X POST -H 'Content-type: application/json' --data '{ "channel": "#npm-notifications","username": "npm bot", "icon_url": "https://static-00.iconduck.com/assets.00/megaphone-emoji-512x390-7a60feky.png","text": "#### New Deployment!\n\n**Package Name:** $(PACKAGE_NAME) \n**Version:** $(PACKAGE_VERSION)   **Published on**: $(PUBLISH_DATE)" }' $(WEBHOOK_URL)



.PHONY: docs
docs: build/docs
	@open build/docs/index.html

build/docs: $(SRC_FILES) node_modules
	@${BIN}/typedoc --out build/docs src/index.ts
	# @rsync -av --delete build/docs/ docs/
	
.PHONY: deploy-site
deploy-site: | clean build/docs test/browser.html test-coverage
	@mkdir -p site
	@cp -r build/docs/* site/
	@cp -r test/browser.html site/tests.html
	@cp -r coverage/ site/coverage/
	@${BIN}/gh-pages -d site

.PHONY: clean
clean:
	rm -rf lib/ coverage/ build/docs/ site/ test/browser.html

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
