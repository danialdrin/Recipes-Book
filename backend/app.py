from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import traceback

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'US_recipes_null.json')

def load_recipes():
    try:
        print("Loading recipes...", flush=True)
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        result = list(data.values())
        print(f"Loaded {len(result)} recipes.", flush=True)
        return result
    except Exception as e:
        print(f"Error loading data: {e}", flush=True)
        return []

recipes = load_recipes()


def make_sort_key(sort_by):
    def sort_key(x):
        val = x.get(sort_by)
        if val is None:
            return (1, 0.0, "")
        if isinstance(val, (int, float)):
            return (0, float(val), "")
        try:
            return (0, float(val), "")
        except (ValueError, TypeError):
            return (0, 0.0, str(val).lower())
    return sort_key


@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    try:
        page  = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 15))
        sort_by = request.args.get('sortBy', 'rating')
        order   = request.args.get('order', 'desc')

        start = (page - 1) * limit
        end   = page * limit

        sorted_data = sorted(recipes, key=make_sort_key(sort_by), reverse=(order == 'desc'))
        page_data   = sorted_data[start:end]

        print(f"GET /api/recipes  page={page} limit={limit} sortBy={sort_by} order={order} -> {len(page_data)} rows", flush=True)
        return jsonify({"page": page, "limit": limit, "total": len(recipes), "data": page_data})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/recipes/search', methods=['GET'])
def search_recipes():
    try:
        title   = request.args.get('title', '').lower()
        sort_by = request.args.get('sortBy', 'rating')
        order   = request.args.get('order', 'desc')

        if title:
            filtered = [
                r for r in recipes
                if (r.get('title')        and title in r['title'].lower())        or
                   (r.get('cuisine')      and title in r['cuisine'].lower())      or
                   (r.get('Contient')     and title in r['Contient'].lower())     or
                   (r.get('Country_State') and title in r['Country_State'].lower())
            ]
        else:
            filtered = recipes

        sorted_data = sorted(filtered, key=make_sort_key(sort_by), reverse=(order == 'desc'))
        result = sorted_data[:100]

        print(f"GET /api/recipes/search  q='{title}' -> {len(result)} rows", flush=True)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=False, use_reloader=False)
