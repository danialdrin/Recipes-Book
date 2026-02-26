import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const safeValue = (val, isNumber = false) => {
    if (val === null || val === undefined) {
        return isNumber ? 0 : 'not provided';
    }
    return val;
};

function getInitialParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        page:   parseInt(params.get('page'))  || 1,
        limit:  parseInt(params.get('limit')) || 10,
        sortBy: params.get('sortBy') || 'rating',
        order:  params.get('order')  || 'desc',
        search: params.get('title')  || '',
    };
}

function App() {
    const initial = useRef(getInitialParams()).current;

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('recipes');
    const [search, setSearch] = useState(initial.search);
    const [page, setPage] = useState(initial.page);
    const [limit, setLimit] = useState(initial.limit);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState(initial.sortBy);
    const [order, setOrder] = useState(initial.order);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('limit', limit);
        params.set('sortBy', sortBy);
        params.set('order', order);
        if (search) params.set('title', search);
        window.history.replaceState(null, '', '?' + params.toString());
    }, [page, limit, sortBy, order, search]);

    useEffect(() => {
        const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            setPage(  parseInt(params.get('page'))  || 1);
            setLimit( parseInt(params.get('limit')) || 10);
            setSortBy(params.get('sortBy') || 'rating');
            setOrder( params.get('order')  || 'desc');
            setSearch(params.get('title')  || '');
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        fetchData();
    }, [view, page, sortBy, order, limit, search]);

    const fetchData = async (currentSearch = search) => {
        setLoading(true);
        try {
            const base = 'http://localhost:5000/api/recipes';
            let url = `${base}?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`;

            if (currentSearch) {
                url = `${base}/search?title=${currentSearch}&sortBy=${sortBy}&order=${order}`;
            } else if (view === 'easycook') {
                url = `${base}?page=${page}&limit=${limit}&sortBy=total_time&order=asc`;
            }

            const res = await axios.get(url);
            const data = currentSearch ? res.data : res.data.data;
            const total = currentSearch ? data.length : res.data.total;

            setRecipes(currentSearch ? data.slice((page - 1) * limit, page * limit) : data);
            setTotalPages(Math.ceil(total / limit) || 1);
        } catch (err) { }
        setLoading(false);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPage(1);
            fetchData(search);
        }
    };

    const handleSort = (e) => {
        const [field, dir] = e.target.value.split('_');
        if (field && dir) {
            setSortBy(field);
            setOrder(dir);
            seeffect
            tPage(1);
        }
    };

    const toggleView = (newView) => {
        setView(newView);
        setPage(1);
        setSearch('');
    };

    const resetSearch = () => {
        setSearch('');
        setSortBy('rating');
        setOrder('desc');
        setPage(1);
    };

    const openModal = (recipe) => setSelectedRecipe(recipe);
    const closeModal = () => setSelectedRecipe(null);

    const renderRecipes = () => recipes.map((r, i) => (
        <div key={i} className="recipe-card" onClick={() => openModal(r)}>
            <div className="recipe-card-header">
                <div className="recipe-card-title">{safeValue(r.title)}</div>
                <div className="recipe-card-cuisine">{safeValue(r.cuisine)}</div>
            </div>
            <div className="recipe-card-body">
                <div className="recipe-card-meta">
                    <span className="recipe-card-rating">{safeValue(r.rating, true)}</span>
                    <span className="recipe-card-time">{safeValue(r.total_time, true)} min</span>
                </div>
                <div className="recipe-card-description">{safeValue(r.description)}</div>
                <div className="recipe-card-footer">
                    <button className="recipe-card-btn view-btn">View Recipe</button>
                </div>
            </div>
        </div>
    ));

    const renderTableRows = () => recipes.map((r, i) => (
        <tr key={i} onClick={() => openModal(r)}>
            <td>{safeValue(r.title)}</td>
            <td>{safeValue(r.Contient)}</td>
            <td>{safeValue(r.Country_State)}</td>
            <td>{safeValue(r.cuisine)}</td>
            <td><span className="rating-badge">{safeValue(r.rating, true)}</span></td>
            <td>{safeValue(r.prep_time, true)} min</td>
            <td>{safeValue(r.cook_time, true)} min</td>
            {view === 'easycook' ? <td>{safeValue(r.total_time, true)} min</td> : <td className="description-cell">{safeValue(r.description)}</td>}
        </tr>
    ));

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <h1 className="logo">Recipe Book</h1>
                        <p className="tagline">Discover the finest American cuisine</p>
                    </div>
                </div>
            </header>

            <nav className="navbar">
                <div className="container">
                    <div className="search-box">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search recipes by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>

                    <div className="filters">
                        <select className="filter-select" onChange={handleSort}>
                            <option value="">Rating</option>
                            <option value="rating_asc">↑</option>
                            <option value="rating_desc">↓</option>
                        </select>
                        <select className="filter-select" onChange={handleSort}>
                            <option value="">Cuisine</option>
                            <option value="cuisine_asc">A–Z</option>
                            <option value="cuisine_desc">Z–A</option>
                        </select>
                        <div className="limit-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Per Page:</span>
                            <input
                                type="number"
                                className="filter-select"
                                style={{ width: '70px', padding: '8px' }}
                                value={limit}
                                min="1"
                                max="100"
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="container">
                    <div className="stats">
                        <span className={`stat-item clickable ${view === 'recipes' ? 'active' : ''}`} onClick={() => toggleView('recipes')}>
                            <span id="recipeCount">{recipes.length}</span> Recipes
                        </span>
                        <span className={`stat-item clickable ${view === 'quickview' ? 'active' : ''}`} onClick={() => toggleView('quickview')}>
                            Quick View
                        </span>
                        <span className={`stat-item clickable ${view === 'easycook' ? 'active' : ''}`} onClick={() => toggleView('easycook')}>
                            Easy to Cook
                        </span>
                    </div>

                    {view === 'recipes' && (
                        <div className="card-view-section">
                            <h2 className="view-title">All Recipes</h2>
                            {!loading && recipes.length === 0 ? (
                                <NoResults onReset={resetSearch} />
                            ) : (
                                <>
                                    <div className="recipes-grid">
                                        {loading ? <div className="loading">Loading delicious recipes...</div> : renderRecipes()}
                                    </div>
                                    <Pagination page={page} total={totalPages} setPage={setPage} />
                                </>
                            )}
                        </div>
                    )}

                    {view === 'quickview' && (
                        <div className="quick-view-section">
                            <h2 className="quick-view-title">Quick View</h2>
                            <div className="table-wrapper">
                                <table className="recipes-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Content</th>
                                            <th>State</th>
                                            <th>Cuisine</th>
                                            <th>Rating</th>
                                            <th>Prep-time</th>
                                            <th>Cooking-time</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <tr><td colSpan="8" className="loading">Loading delicious recipes...</td></tr> : renderTableRows()}
                                    </tbody>
                                </table>
                            </div>
                            {!loading && recipes.length === 0 && <NoResults onReset={resetSearch} />}
                            {recipes.length > 0 && <Pagination page={page} total={totalPages} setPage={setPage} />}
                        </div>
                    )}

                    {view === 'easycook' && (
                        <div className="easy-cook-section">
                            <h2 className="view-title">Easy to Cook (Less Time)</h2>
                            <div className="table-wrapper">
                                <table className="recipes-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Content</th>
                                            <th>State</th>
                                            <th>Cuisine</th>
                                            <th>Rating</th>
                                            <th>Prep-time</th>
                                            <th>Cooking-time</th>
                                            <th>Total Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <tr><td colSpan="8" className="loading">Loading easy recipes...</td></tr> : renderTableRows()}
                                    </tbody>
                                </table>
                            </div>
                            {!loading && recipes.length === 0 && <NoResults onReset={resetSearch} />}
                            {recipes.length > 0 && <Pagination page={page} total={totalPages} setPage={setPage} />}
                        </div>
                    )}
                </div>
            </main>

            {selectedRecipe && (
                <div className="modal active" onClick={closeModal}>
                    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <div className="modal-body">
                            <div className="recipe-detail">
                                <h2 className="recipe-title">{selectedRecipe.title}</h2>
                                <div className="recipe-meta">
                                    <span className="rating">Rating: {safeValue(selectedRecipe.rating, true)}</span>
                                    <span className="cuisine">{safeValue(selectedRecipe.cuisine)}</span>
                                    {selectedRecipe.serves && <span className="serves">{safeValue(selectedRecipe.serves)}</span>}
                                </div>

                                <div className="recipe-grid">

                                    <div className="recipe-section">
                                        <h3>Cooking Times</h3>
                                        <ul className="info-list">
                                            <li><strong>Prep Time:</strong> {safeValue(selectedRecipe.prep_time, true)} min</li>
                                            <li><strong>Cook Time:</strong> {safeValue(selectedRecipe.cook_time, true)} min</li>
                                            <li><strong>Total Time:</strong> {safeValue(selectedRecipe.total_time, true)} min</li>
                                        </ul>
                                    </div>

                                    <div className="recipe-section">
                                        <h3>Location</h3>
                                        <ul className="info-list">
                                            <li><strong>Continent:</strong> {safeValue(selectedRecipe.Contient)}</li>
                                            <li><strong>Country / State:</strong> {safeValue(selectedRecipe.Country_State)}</li>
                                        </ul>
                                    </div>

                                    <div className="recipe-section full-width">
                                        <h3>Description</h3>
                                        <p className="description">{safeValue(selectedRecipe.description)}</p>
                                    </div>

                                    {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                                        <div className="recipe-section">
                                            <h3>Ingredients</h3>
                                            <ul className="ingredients-list">
                                                {selectedRecipe.ingredients.map((ing, i) => (
                                                    <li key={i}>{ing}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="recipe-section">
                                            <h3>Ingredients</h3>
                                            <p>not provided</p>
                                        </div>
                                    )}

                                    {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                                        <div className="recipe-section">
                                            <h3>Instructions</h3>
                                            <ol className="instructions-list">
                                                {selectedRecipe.instructions.map((step, i) => (
                                                    <li key={i}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    ) : (
                                        <div className="recipe-section">
                                            <h3>Instructions</h3>
                                            <p>not provided</p>
                                        </div>
                                    )}

                                    {selectedRecipe.nutrients && Object.keys(selectedRecipe.nutrients).length > 0 ? (
                                        <div className="recipe-section full-width">
                                            <h3>Nutrition (Per Serving)</h3>
                                            <div className="nutrients-grid">
                                                {Object.entries(selectedRecipe.nutrients).map(([key, value]) => (
                                                    <div className="nutrient-item" key={key}>
                                                        <div className="nutrient-label">
                                                            {key.replace(/([A-Z])/g, ' $1').replace('Content', '').trim()}
                                                        </div>
                                                        <div className="nutrient-value">{safeValue(value)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="recipe-section full-width">
                                            <h3>Nutrition (Per Serving)</h3>
                                            <p>not provided</p>
                                        </div>
                                    )}

                                    <div className="recipe-section full-width" style={{ textAlign: 'center' }}>
                                        {selectedRecipe.URL && (
                                            <a href={selectedRecipe.URL} target="_blank" rel="noopener noreferrer" className="recipe-link">
                                                View Original Recipe
                                            </a>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer">
                <div className="container">
                    <p>&copy; 2026 RecipeHub - American Recipe Database. All recipes sourced from quality culinary sources.</p>
                </div>
            </footer>
        </>
    );
}

function NoResults({ onReset }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', gap: '16px'
        }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#555' }}>No recipes found</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.95rem' }}>
                Try a different search term or reset the filters.
            </p>
            <button
                onClick={onReset}
                style={{
                    marginTop: '8px', padding: '10px 24px', borderRadius: '8px',
                    border: 'none', background: '#e05a2b', color: '#fff',
                    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer'
                }}
            >
                Reset Search &amp; Filters
            </button>
        </div>
    );
}

function Pagination({ page, total, setPage }) {
    return (
        <div className="pagination-container">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
            <div className="pagination-info">
                <span>Page {page} of {total}</span>
            </div>
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}>Next →</button>
        </div>
    );
}

export default App;