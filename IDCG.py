import xml.etree.ElementTree as ET
import os
import glob
import json
from tqdm import tqdm
import math

xml_path = "./regis-collection/queries.xml"
txt_path = "./regis-collection/qrels.txt"


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


def calc_idcg(qnum, tam):
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
    print(idcg)


def main():
    qnum = get_query_number('História da geoquímica na Petrobras')
    calc_idcg(qnum, 10)


if __name__ == "__main__":
    main()
