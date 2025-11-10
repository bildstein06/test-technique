COMPOSE = docker compose

.PHONY: all
all: start

.PHONY: start
start: up wait-for-db install-deps setup-db
	@echo "================================="
	@echo "  Projet démarré et configuré !  "
	@echo "================================="
	@echo "Accès :"
	@echo "  Frontend            -> http://localhost:3000"
	@echo "================================="
	@echo "Pour voir les logs: make logs"
	@echo "Pour arrêter:       make down"

.PHONY: install-deps
install-deps: install-laravel install-frontend

.PHONY: setup-db
setup-db: migrate seed storage-link

.PHONY: up
up: build
	@echo "Lancement des conteneurs..."
	$(COMPOSE) up -d

.PHONY: down
down:
	@echo "Arrêt et suppression des conteneurs..."
	$(COMPOSE) down --remove-orphans

.PHONY: build
build:
	@echo "Construction des images Docker..."
	$(COMPOSE) build

# Nouvelle cible pour l'attente
.PHONY: wait-for-db
wait-for-db:
	@echo "Attente de 10 secondes pour le démarrage de MySQL..."
	sleep 10
	@echo "Reprise des opérations."

.PHONY: install-laravel
install-laravel: up
	@echo "Vérification des dépendances Laravel (composer)..."
	@if [ ! -f "vendor/autoload.php" ]; then \
		echo "Installation des dépendances Laravel (cela peut prendre un moment)..."; \
		$(COMPOSE) exec -T laravel.test composer install --no-interaction --no-progress; \
	else \
		echo "Dépendances Laravel (vendor) déjà présentes."; \
	fi

.PHONY: install-frontend
install-frontend: up
	@echo "Vérification des dépendances Frontend (npm)..."
	@if [ ! -d "hotels-frontend/node_modules" ]; then \
		echo "Installation des dépendances Frontend (cela peut prendre un moment)..."; \
		$(COMPOSE) exec -T frontend npm install; \
	else \
		echo "Dépendances Frontend (node_modules) déjà présentes."; \
	fi

.PHONY: migrate
migrate:
	@echo "Lancement des migrations de la base de données..."
	$(COMPOSE) exec -T laravel.test php artisan migrate:fresh

.PHONY: seed
seed:
	@echo "Lancement des seeders..."
	$(COMPOSE) exec -T laravel.test php artisan db:seed

.PHONY: storage-link
storage-link:
	@if [ ! -L "public/storage" ]; then \
		echo "Création du lien symbolique 'public/storage'..."; \
		$(COMPOSE) exec -T laravel.test php artisan storage:link; \
	else \
		echo "Lien symbolique 'public/storage' déjà présent."; \
	fi

.PHONY: logs
logs:
	$(COMPOSE) logs -f
