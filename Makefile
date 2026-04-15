SHELL := /bin/bash

.PHONY: help setup-web setup-flutter web flutter-run flutter-ios flutter-android test test-web test-flutter clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

setup-web: ## Install web dependencies
	cd web && npm install
	@echo "Web setup complete. Run: make web"

setup-flutter: ## Install Flutter dependencies
	flutter pub get
	@echo "Flutter setup complete. Run: make flutter-run"

setup: setup-web setup-flutter ## Install all deps (web + Flutter)

web: ## Start web app (static server at http://localhost:8080)
	cd web && python3 -m http.server 8080

flutter-run: ## Run Flutter app on connected device
	flutter run

flutter-ios: ## Build and run on iOS simulator
	flutter build ios --simulator --no-codesign && flutter run -d iPhone

flutter-android: ## Build and run Android debug APK
	flutter build apk --debug && flutter run -d emulator

test: test-flutter test-web ## Run all tests

test-flutter: ## Run Flutter unit tests
	flutter analyze
	flutter test

test-web: ## Run web tests (Vitest + Playwright)
	cd web && npx vitest run && npx playwright test

clean: ## Remove build artifacts
	flutter clean
	rm -rf web/node_modules build/
