from clinicmanager.app import db


class CustomModel:
    @staticmethod
    def _commit():
        try:
            db.session.commit()
            
            return True
        
        except Exception as e:
            from pprint import pprint
            
            db.session.rollback()
            db.session.flush()
            
            pprint(e, indent=4)
            
        return False

    @staticmethod
    def serialize_query(rows):
        return [row._asdict() for row in rows]