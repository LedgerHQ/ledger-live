IMAGE_NAME = coin-tester-chopsticks
CONTAINER_NAME = chopsticks
CURRENT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

build:
		docker build -f $(CURRENT_DIR)/chopsticks.Dockerfile -t $(IMAGE_NAME)\:latest .

run:
		docker run --rm -d -p "8000:8000" --name $(CONTAINER_NAME) $(IMAGE_NAME)\:latest
