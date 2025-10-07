import React, { useEffect, useState, useRef, useCallback } from 'react';
import './ImageGallery.scss';
import { GetImageContent, GetImageThumbnail } from '../../../wailsjs/go/main/App';

type ImageType = {
    Name: string;
    Path: string;
    Ext: string;
    Mime: string;
    Size: number;
    Content: string; // Base64 encoded image data
};

interface ImageGalleryProps {
    images: Promise<ImageType[]>;
    onSelect: (image: ImageType) => void;
    OnSelectAvailable: boolean;
}

// Component for individual lazy-loaded gallery image
function GalleryImage({ image, onClick }: { image: ImageType; onClick: () => void }) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const imgElement = imgRef.current;
        if (!imgElement) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(async (entry) => {
                    if (entry.isIntersecting && !isLoaded && !isLoading) {
                        // Load image when entering viewport
                        setIsLoading(true);
                        try {
                            const content = await GetImageThumbnail(image.Path);
                            setImageSrc(`data:${image.Mime};base64,${content}`);
                            setIsLoaded(true);
                        } catch (error) {
                            console.error('Failed to load thumbnail:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    } else if (!entry.isIntersecting && isLoaded) {
                        // Unload image when leaving viewport to avoid issue
                        setImageSrc('');
                        setIsLoaded(false);
                    }
                });
            },
            {
                rootMargin: '100px',
                threshold: 0.01,
            }
        );

        observer.observe(imgElement);

        return () => {
            if (imgElement) {
                observer.unobserve(imgElement);
            }
        };
    }, [image.Path, image.Mime, isLoaded, isLoading]);

    return (
        <div className="image-item" onClick={onClick}>
            {isLoading && !imageSrc && (
                <div
                    className="thumbnail-loading"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    Loading...
                </div>
            )}
            <img
                ref={imgRef}
                src={imageSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
                alt={image.Name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imageSrc ? 1 : 0 }}
            />
        </div>
    );
}

export default function ImageGallery({ images, onSelect, OnSelectAvailable }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
    const [GalleryImages, setGalleryImages] = useState<ImageType[]>([]);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    useEffect(() => {
        images
            .then((resolvedImages) => {
                setGalleryImages(resolvedImages);
            })
            .catch((error) => {
                console.error('Failed to load images:', error);
            });
    }, [images]);

    const handleImageClick = async (image: ImageType) => {
        setSelectedImage(image);
        setIsLoadingPreview(true);
        setPreviewContent('');

        try {
            // Load full image content only when preview is opened
            const content = await GetImageContent(image.Path);
            setPreviewContent(content);
        } catch (error) {
            console.error('Failed to load image content:', error);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSelect = () => {
        if (selectedImage && onSelect) {
            onSelect(selectedImage);
        }
        setSelectedImage(null);
        setPreviewContent('');
    };

    const handleCancel = () => {
        setSelectedImage(null);
        setPreviewContent('');
    };

    return (
        <div className="image-gallery">
            <div className="image-grid">
                {GalleryImages.map((image, index) => (
                    <GalleryImage key={index} image={image} onClick={() => handleImageClick(image)} />
                ))}
            </div>

            {selectedImage && (
                <div className="image-popup" onClick={handleCancel}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        {isLoadingPreview ? (
                            <div className="loading-spinner">Loading preview...</div>
                        ) : (
                            previewContent && (
                                <img
                                    src={`data:${selectedImage.Mime};base64,${previewContent}`}
                                    alt={selectedImage.Name}
                                />
                            )
                        )}
                        <div className="image-metadata">
                            <h3>Image Information</h3>
                            <div className="metadata-grid">
                                <div className="metadata-item">
                                    <span className="metadata-label">Name:</span>
                                    <span className="metadata-value">{selectedImage.Name}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Path:</span>
                                    <span className="metadata-value">{selectedImage.Path}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Extension:</span>
                                    <span className="metadata-value">{selectedImage.Ext}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">MIME Type:</span>
                                    <span className="metadata-value">{selectedImage.Mime}</span>
                                </div>
                                <div className="metadata-item">
                                    <span className="metadata-label">Size:</span>
                                    <span className="metadata-value">{(selectedImage.Size / 1024).toFixed(2)} KB</span>
                                </div>
                            </div>
                        </div>
                        <div className="popup-buttons">
                            {OnSelectAvailable && (
                                <button className="btn-select" onClick={handleSelect}>
                                    Select
                                </button>
                            )}
                            <button className="btn-cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
