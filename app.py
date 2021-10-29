'''
@author Kamal Kant
@date OCT 28 2021
@description flask app for handling audio and text of the asr 
'''

from flask import Flask,render_template,request,jsonify
import os

app = Flask(__name__)

UPLOAD_ROOT_FOLDER = 'waves/english/'
# ALLOWED_EXTENSIONS = {'wav', 'mp3'}


@app.route("/")
def hello():
    return render_template('index.html')


@app.route('/recognize', methods=['POST'])
def upload_static_file():
    print("Got request in static files")
    print(request.files)
    f = request.files['sound']
    language = request.form.get('language')
    filename = request.form.get('filename')
    print(language)
    f.save(os.path.join(UPLOAD_ROOT_FOLDER, filename))
    resp = {"success": True, "response": "Here is asr output"}
    return jsonify(resp), 200

app.run(debug = True)
