# Prerrequisitos

- yarn
- docker
- docker-compose
- Node
- python 3

# Build

## Linux

Execute o arquivo `init.sh` na raiz do projeto.

## Windows

Siga os passos do arquivo `init.sh`.

# APIs

`/index-js` - Indexa os arquivos json da pasta criada pelo parser

`/refresh` - Recarrega os indices do es

`/search` - Pesquisa pelo termo no query param `query`

`/doc/:id` - Retorna as informações de um documento dado o `_id` do elasticsearch
