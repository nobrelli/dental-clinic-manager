from clinicmanager import build_app

if __name__ == '__main__':
    app = build_app()
    app.run(host='0.0.0.0', debug=False, port=5000)
