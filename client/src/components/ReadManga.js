import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spin, Button, message, Breadcrumb } from 'antd';
import { LeftOutlined, RightOutlined, HomeOutlined } from '@ant-design/icons';
import './readManga.style.scss';

const ReadManga = () => {
    const { id, chapter } = useParams();
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mangaInfo, setMangaInfo] = useState(null);
    const [currentChapter, setCurrentChapter] = useState(null);
    const [progress, setProgress] = useState(0);
    const [totalImages, setTotalImages] = useState(0);
    const [failedImages, setFailedImages] = useState(new Set());

    useEffect(() => {
        fetchMangaInfo();
        
        return () => {
            setImages([]);
            setProgress(0);
            setTotalImages(0);
            setFailedImages(new Set());
        };
    }, [id]);

    useEffect(() => {
        if (mangaInfo) {
            const foundChapter = mangaInfo.chapters.find(ch => ch._id.toString() === chapter);
            setCurrentChapter(foundChapter);
        }
    }, [mangaInfo, chapter]);

    useEffect(() => {
        if (!currentChapter || !id) return;

        setLoading(true);
        setImages([]);
        setProgress(0);

        const eventSource = new EventSource(
            `${process.env.REACT_APP_BACKEND_URL}/data/${id}/${currentChapter._id}`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.total) {
                setTotalImages(data.total);
                setImages(new Array(data.total));
                setProgress(0);
            } else if (data.index !== undefined && data.data) {
                setImages(prevImages => {
                    const newImages = [...prevImages];
                    newImages[data.index] = {
                        contentType: data.contentType,
                        data: data.data,
                        index: data.index
                    };
                    return newImages;
                });
                
                setProgress(prev => {
                    const newProgress = ((data.index + 1) / totalImages) * 100;
                    return Math.min(newProgress, 100);
                });
            } else if (data.error) {
                setFailedImages(prev => new Set(prev).add(data.index));
                message.error(`Failed to load image ${data.index + 1}`);
            } else if (data.complete) {
                setLoading(false);
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            message.error('Error loading images');
            setLoading(false);
            eventSource.close();
        };

        return () => {
            eventSource.close();
            setImages([]);
            setProgress(0);
        };
    }, [currentChapter?._id, id]);

    const fetchMangaInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/data/${id}`);
            if (!response.ok) throw new Error('Failed to fetch manga info');
            const data = await response.json();
            setMangaInfo(data);
        } catch (error) {
            console.error('Error fetching manga info:', error);
            message.error('Failed to load manga information');
        }
    };

    const navigateChapter = (direction) => {
        if (!mangaInfo?.chapters || !currentChapter) return;
        
        const currentIndex = mangaInfo.chapters.findIndex(ch => ch._id === currentChapter._id);
        if (currentIndex === -1) return;

        let newChapter;
        if (direction === 'next' && currentIndex > 0) {
            newChapter = mangaInfo.chapters[currentIndex - 1];
        } else if (direction === 'prev' && currentIndex < mangaInfo.chapters.length - 1) {
            newChapter = mangaInfo.chapters[currentIndex + 1];
        }

        if (newChapter) {
            navigate(`/manga/${id}/${newChapter._id}`);
        }
    };

    const isFirstChapter = currentChapter && mangaInfo?.chapters[0]._id === currentChapter._id;
    const isLastChapter = currentChapter && 
        mangaInfo?.chapters[mangaInfo.chapters.length - 1]._id === currentChapter._id;

    const renderLoadingState = () => (
        <div className="loading-container">
            <Spin size="large" />
            {progress > 0 && (
                <div className="loading-progress">
                    Loading: {Math.round(progress)}%
                </div>
            )}
        </div>
    );

    const renderImage = (image, index) => {
        if (!image) return null;
        if (failedImages.has(index)) {
            return (
                <div key={index} className="failed-image">
                    Failed to load image {index + 1}
                </div>
            );
        }
        return (
            <img 
                key={index}
                src={`data:${image.contentType};base64,${image.data}`}
                alt={`Page ${index + 1}`}
                loading="lazy"
            />
        );
    };

    return (
        <div className="read-manga-container">
            <div className="manga-header">
                <Breadcrumb className="breadcrumb">
                    <Breadcrumb.Item>
                        <Link to="/"><HomeOutlined /> Home</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to={`/manga/${id}`}>{mangaInfo?.title}</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>{currentChapter?.title}</Breadcrumb.Item>
                </Breadcrumb>
                <h1>{mangaInfo?.title} - {currentChapter?.title}</h1>
                <div className="chapter-navigation top">
                    {!isLastChapter && (
                        <Button onClick={() => navigateChapter('prev')}>
                            <LeftOutlined /> Previous Chapter
                        </Button>
                    )}
                    {!isFirstChapter && (
                        <Button onClick={() => navigateChapter('next')}>
                            Next Chapter <RightOutlined />
                        </Button>
                    )}
                </div>
            </div>

            {loading ? renderLoadingState() : (
                <div className="manga-images">
                    {images.map((image, index) => renderImage(image, index))}
                </div>
            )}

            <div className="chapter-navigation bottom">
                {!isLastChapter && (
                    <Button onClick={() => navigateChapter('prev')}>
                        <LeftOutlined /> Previous Chapter
                    </Button>
                )}
                {!isFirstChapter && (
                    <Button onClick={() => navigateChapter('next')}>
                        Next Chapter <RightOutlined />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ReadManga; 