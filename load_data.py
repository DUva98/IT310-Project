import csv
import requests

FILE_NAME = 'data.csv'

# Read a CSV file line by line
with open(FILE_NAME, 'r') as file:
    firstLine = file.readline()
    csv_reader = csv.reader(file)
    for line in csv_reader:
        if len(line) != 7:
            print(line)
            exit(1)
        data = {
            "name": line[0],
            "price": line[1],
            "description": line[2],
            "pet_type": line[3],
            "age": line[5],
            "imageURL": line[6]
        }
        
        if(line[4] != ''):
            data['pet_subtype'] = line[4]

        requests.post('http://localhost/createItem', json=data)