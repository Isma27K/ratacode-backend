import React, { useState, useEffect } from 'react';

const ChapterViewer = ({ mangaId, chapterId }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!mangaId || !chapterId) return;

        let eventSource;
        setLoading(true);
        
        const loadImages = async () => {
            eventSource = new EventSource(`/api/manga/${mangaId}/${chapterId}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.end) {
                    eventSource.close();
                    setLoading(false);
                    return;
                }

                if (data.error) {
                    console.error(`Error loading image ${data.index}: ${data.error}`);
                    return;
                }

                // Create a proxy URL for the image
                const imageUrl = `/api/manga/proxy-image?url=${encodeURIComponent(data.url)}`;
                
                setImages(prevImages => {
                    const newImages = [...prevImages];
                    newImages[data.index] = imageUrl;
                    return newImages;
                });
            };

            eventSource.onerror = (error) => {
                console.error('EventSource failed:', error);
                eventSource.close();
                setLoading(false);
            };
        };

        loadImages();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [mangaId, chapterId]);

    return (
        <div className="chapter-viewer">
            {loading && <div>Loading...</div>}
            <div className="images-container">
                {images.map((imageUrl, index) => (
                    imageUrl && (
                        <div key={index} className="image-wrapper">
                            <img 
                                src={imageUrl} 
                                alt={`Page ${index + 1}`}
                                loading="lazy"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default ChapterViewer; 