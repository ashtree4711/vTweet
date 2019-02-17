from flask import Flask, redirect, render_template, request, send_from_directory, session, url_for
from flask_bootstrap import Bootstrap
import datetime

import vi_twitter.search as search
import vi_twitter.utilities as utilities


app = Flask(__name__)
app.config.from_pyfile('config/app_config.ini')
app.secret_key = app.config['APP_SECRET_KEY']
Bootstrap(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/contact')
def contact():
    return render_template('contact.html')


@app.route('/conversation', methods=['POST'])
def conversation():  
        # Start a new session for searching
    session['current_session'] = '' # empty the current session, in case someone uses both the search and upload options after each other
    session['session_type'] = 'search'
    
        # Save parameters from form input
    requestedTweetID = request.form.get('tweetID')
    language = request.form.get('langopt')
    visualization_type = request.form.get('visopt')
    
        # Search for the conversation, save it as a JSON, return the filename of the JSON as 'basis' for the visualization
    print('INFO: Searching for the conversation')
    mode = session['session_type']
        # Call get_conversation() which executes the query and saves the result in a JSON file; 
        # Then later use the created JSON file to do something with the search results
    basis = search.get_conversation(requestedTweetID, language, max_replies=200)
    
        # Depending on the type of visualization selected, redirect to the corresponding URL and pass along the values 'mode' and 'basis'
    if visualization_type=='list':
        session['current_session'] = basis
        print("SESSION INFORMATION: ", session)
        return redirect(url_for('list_visualization', mode=mode, basis=basis), code=307)
    elif visualization_type=='graph':
        session['current_session'] = basis
        print("SESSION INFORMATION: ", session)
        return redirect(url_for('graph_visualization', mode=mode, basis=basis), code=307)


@app.route('/upload', methods=['GET', 'POST'])
def upload():
        # Start a new session with an uploaded file
    session['current_session'] = '' # Empty the current session, in case someone uses both the search and upload options after each other
    session['session_type'] = 'upload'
    
        # Save parameters from form input
    visualization_type = request.form.get('visopt')

        # Save the JSON file uploaded by the user
        #TODO: Zuerst überprüfen, ob es eine valide Datei ist?
    f = request.files['file']
    new_filename = 'import_' + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    f.save(app.config['USERUPLOAD_JSON_FILES'] + '/' + new_filename + '.json', buffer_size=16384)
    print('UPLOADED FILE SAVED AS: ', app.config['USERUPLOAD_JSON_FILES'] + '/' + new_filename + '.json')
    
        # Load the conversation from the imported file instead of performing a search; use the filename of the JSON as 'basis' for the visualization
    print('INFO: Using an imported JSON file to load the conversation')
    mode = session['session_type']
        # Use the uploaded JSON file to do something with the results saved in it
    basis = new_filename

        # Depending on the type of visualization selected, redirect to the corresponding URL and pass along the values 'mode' and 'basis'
    if visualization_type=='list':
        session['current_session'] = basis
        print("SESSION INFORMATION: ", session)
        return redirect(url_for('list_visualization', mode=mode, basis=basis), code=307)
    elif visualization_type=='graph':
        session['current_session'] = basis
        print("SESSION INFORMATION: ", session)
        return redirect(url_for('graph_visualization', mode=mode, basis=basis), code=307)


@app.route('/conversation/list', methods=['POST'])
def list_visualization():
    if 'current_session' in session:
            # Request the arguments that were passed with the redirect
        mode = request.args['mode']
        basis = request.args['basis']
        basis = session['current_session']
            # TODO: @Lara: Hier stattdessen Template für Listen-Ansicht aufrufen, oder? (bzw. das bisher conversation.html heißende Template dazu nutzen)
        return render_template('conversation.html', response=utilities.json_to_dictionary(mode, basis))
    else:
        return 'Error while retrieving session information. Please start a new search.'


@app.route('/conversation/graph', methods=['POST'])
def graph_visualization():
    if 'current_session' in session:
            # Request the arguments that were passed with the redirect
        mode = request.args['mode']
        basis = request.args['basis']
        basis = session['current_session']
            # TODO: @Lara: Hier stattdessen Template für Graph-Ansicht aufrufen, oder?
        return render_template('conversation.html', response=utilities.json_to_dictionary(mode, basis))
    else:
        return 'Error while retrieving session information. Please start a new search.'


@app.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
        # Take the chosen file from the path specified in the config; serve file at /download/[...].json
    return send_from_directory(app.config['TEMP_JSON_FILES'], filename)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)
    # To run without debug: #app.run()