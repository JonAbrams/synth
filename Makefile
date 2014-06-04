test:
	./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -u exports -R spec
	./node_modules/.bin/codeclimate < coverage/lcov.info

.PHONY: test
