import xml.etree.ElementTree as ET
import os
import glob
import json
from tqdm import tqdm
import math

xml_path = "./regis-collection/queries.xml"
txt_path = "./regis-collection/qrels.txt"

query = "História da geoquímica na Petrobras"
tamanho = 100
dcg = 47.18569448169033


def get_query_number(title):
    qnum = ''
    tree = ET.parse(xml_path)
    root = tree.getroot()

    a = root.iterfind("./top/title")
    b = root.iterfind("./top/num")

    for x, y in zip(a, b):
        if x.text == title:
            qnum = y.text
            break

    return qnum


def calc_ndcg(qnum, tam, dcg):
    scores = []
    file = open(txt_path, "r")
    lines = file.readlines()

    for line in lines:
        if line[3] != " ":
            if line[:3] == qnum:
                scores.append(line[-2])
            elif line[:2] == qnum:
                scores.append(line[-2])

    scores.sort(reverse=True)
    # print(scores)

    count = 1
    idcg = 0
    for score in scores:
        if count < tam:
            idcg = idcg + (int(score)/math.log2(count + 1))
        count += 1

    result = dcg / idcg

    print(result)


def main():
    qnum = get_query_number(query)
    calc_ndcg(qnum, tamanho, dcg)


if __name__ == "__main__":
    main()
