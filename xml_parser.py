import xml.etree.ElementTree as ET
import os, glob
import json
from tqdm import tqdm

xml_path = "./regis-collection/documents"
json_path = "./regis-collection/documents-json"

def get_simple_file_name(filename):
	return filename.split("/")[-1]
	
def parse_xml_to_json(path, xml_file):
	doc_content = {}
	doc = {}

	tree = ET.parse(xml_file)
	root = tree.getroot()
	
	for field in root.iter('field'):
		text = field.text
		name = field.get('name')
		
		doc_content[name] = text
		
	
	doc['doc'] = doc_content
	json_data = json.dumps(doc, indent = 4)
	
	with open(os.path.join(json_path, "{}.json".format(get_simple_file_name(path))), "w") as outfile:
		outfile.write(json_data)
		
		
def main():
	if not os.path.exists(json_path):
		os.makedirs(json_path)

	for filename in tqdm(glob.glob(os.path.join(xml_path, '*.xml'))):
		with open(os.path.join(filename), 'r', encoding="utf-8") as file:
			parse_xml_to_json(filename, file)


if __name__ == "__main__":
	main()
