import os
import mysql.connector
from mysql.connector import Error
from fastapi import HTTPException

DIRECTION = "localhost"

def get_db_connection():
    """Crea una conexión a la base de datos MySQL utilizando variables de entorno."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", DIRECTION),
            user=os.getenv("DB_USER", "user"),
            password=os.getenv("DB_PASSWORD", "password"),
            database=os.getenv("DB_NAME", "stellargather")
        )
        if connection.is_connected():
            print("Conexión exitosa a MySQL")
            return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def get_cursor():
    """Obtiene un cursor de la conexión a la base de datos."""
    connection = get_db_connection()
    if connection:
        return connection, connection.cursor(dictionary=True)
    return None, None

# Función para ejecutar una consulta SQL (SELECT)
def execute_query(query, params=None):
    """
    Ejecuta una consulta SQL SELECT en la base de datos y devuelve los resultados.

    Args:
        query (str): La consulta SQL a ejecutar.
        params (tuple, optional): Parámetros para la consulta SQL.

    Returns:
        list[dict]: Lista de filas obtenidas como resultado de la consulta.

    Raises:
        HTTPException: Si ocurre un error al ejecutar la consulta.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Usamos dictionary=True para obtener los resultados como diccionarios
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except Error as err:
        raise HTTPException(status_code=500, detail=f"Error executing query: {err}")
    finally:
        cursor.close()
        conn.close()

# Función para ejecutar una consulta SQL (INSERT, UPDATE, DELETE)
def execute_non_query(query, params=None):
    """
    Ejecuta una consulta SQL INSERT, UPDATE o DELETE en la base de datos.

    Args:
        query (str): La consulta SQL a ejecutar.
        params (tuple, optional): Parámetros para la consulta SQL.

    Returns:
        int: Número de filas afectadas.

    Raises:
        HTTPException: Si ocurre un error al ejecutar la consulta.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
    except Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error executing non-query: {err}")
    finally:
        cursor.close()
        conn.close()
