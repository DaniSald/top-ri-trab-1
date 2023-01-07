#!/bin/bash

yarn
python3 xml_parser.py
docker-compose up -d
yarn start