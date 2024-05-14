IMAGE_NAME = coin-tester-zombienet

build:
		docker build -f Dockerfile -t $(IMAGE_NAME)\:latest .

run:
		docker run --rm -d -p 31323\:31323 -p 3003\:3003 -p 1998\:1998 --name zombienet $(IMAGE_NAME)\:latest
