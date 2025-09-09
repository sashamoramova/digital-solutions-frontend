import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { type Item } from '@/shared/types/item';
import { itemsApi } from '@/entities/item/api';
import styles from './virtual-table.module.css';

interface SimpleTableProps {
    pageSize?: number;
}

export const SimpleTable = ({ pageSize = 20 }: SimpleTableProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Загрузка данных
    const loadItems = async (page: number) => {
        if (loading) return;
        
        try {
            // console.log('Loading items for page:', page);
            setLoading(true);
            const [itemsResponse, stateResponse] = await Promise.all([
                itemsApi.getItems({ page, limit: pageSize, term: searchTerm }),
                itemsApi.getState() // Теперь загружаем состояние при каждой загрузке страницы
            ]);

            if (itemsResponse.data?.data) {
                let newItems = itemsResponse.data.data.items;
                
                // Применяем сохраненный порядок и загружаем выбранные элементы
                if (stateResponse?.data?.data) {
                    // Сначала применяем порядок сортировки
                    if (page === 1 && stateResponse.data.data.order && stateResponse.data.data.order.length > 0) {
                        const orderMap = new Map(stateResponse.data.data.order.map((id: number, index: number) => [id, index]));
                        newItems = [...newItems].sort((a, b) => {
                            const orderA = orderMap.get(a.id) ?? Number.MAX_VALUE;
                            const orderB = orderMap.get(b.id) ?? Number.MAX_VALUE;
                            return orderA - orderB;
                        });
                    }

                    // Затем обновляем выбранные элементы
                    if (stateResponse.data.data.selected) {
                        setSelectedItems(new Set(stateResponse.data.data.selected));
                    }
                }

                setItems(prev => page === 1 ? newItems : [...prev, ...newItems]);
                setTotalItems(itemsResponse.data.data.total);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Failed to load items:', error);
        } finally {
            setLoading(false);
        }
    };

    // Инициализация и загрузка начального состояния
    useEffect(() => {
        const initializeTable = async () => {
            if (initialized) return;
            
            try {
                setLoading(true);
                // Сначала загружаем состояние
                const stateResponse = await itemsApi.getState();
                if (stateResponse.data?.data) {
                    if (stateResponse.data.data.selected) {
                        setSelectedItems(new Set(stateResponse.data.data.selected));
                    }
                }
                // Затем загружаем первую страницу
                await loadItems(1);
                setInitialized(true);
            } catch (error) {
                console.error('Failed to initialize table:', error);
            } finally {
                setLoading(false);
            }
        };
        
        initializeTable();
    }, []);

    // Обработчик прокрутки
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !initialized) return;

        const handleScroll = () => {
            if (loading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Если прокрутили почти до конца
            if (scrollHeight - scrollTop - clientHeight < 100) {
                // И есть ещё элементы для загрузки
                if (items.length < totalItems) {
                    // console.log('Loading more items...');
                    loadItems(currentPage + 1);
                }
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loading, items?.length || 0, totalItems, currentPage, initialized]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Фильтрация элементов
    const filteredItems = items.filter(item => 
        item.value.toString().includes(searchTerm)
    );

    const toggleItemSelection = useCallback((itemId: number) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            
            // Сохраняем выбранные элементы на сервере
            const selectedArray = Array.from(newSet);
            itemsApi.saveSelected(selectedArray).catch(error => {
                console.error('Failed to save selected items:', error);
            });
            
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(async () => {
        try {
            const response = await itemsApi.saveSelected(filteredItems.map(item => item.id));
            if (response.data?.data?.selected) {
                setSelectedItems(new Set(response.data.data.selected));
            }
        } catch (error) {
            console.error('Failed to save all selected items:', error);
        }
    }, [filteredItems]);

    const handleClearSelection = useCallback(async () => {
        try {
            const response = await itemsApi.saveSelected([]);
            if (response.data?.data?.selected) {
                setSelectedItems(new Set(response.data.data.selected));
            }
        } catch (error) {
            console.error('Failed to clear selected items:', error);
        }
    }, []);

    // Обработчик перетаскивания
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        const newItems = Array.from(filteredItems);
        const [reorderedItem] = newItems.splice(sourceIndex, 1);
        newItems.splice(destinationIndex, 0, reorderedItem);

        // Обновляем состояние
        setItems(prevItems => {
            const itemsToUpdate = [...prevItems];
            newItems.forEach((item, index) => {
                const originalIndex = itemsToUpdate.findIndex(i => i.id === item.id);
                if (originalIndex !== -1) {
                    const [itemToMove] = itemsToUpdate.splice(originalIndex, 1);
                    itemsToUpdate.splice(index, 0, itemToMove);
                }
            });
            return itemsToUpdate;
        });

        // Сохраняем новый порядок и получаем полное состояние
        try {
            const response = await itemsApi.saveOrder(newItems.map(item => item.id));
            if (response.data?.data) {
                // Обновляем выбранные элементы из состояния сервера
                if (response.data.data.selected) {
                    setSelectedItems(new Set(response.data.data.selected));
                }
            }
        } catch (error) {
            console.error('Failed to save order:', error);
        }
    };

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Менеджер элементов</h1>
            <div className={styles.header}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Поиск элементов..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.actions}>
                    <button onClick={handleSelectAll} className={styles.button}>
                        Выбрать все
                    </button>
                    <button onClick={handleClearSelection} className={styles.button}>
                        Очистить выбор
                    </button>
                </div>
            </div>
            <div className={styles.info}>
                Показано {items?.length || 0} из {totalItems} элементов • Выбрано: {selectedItems.size}
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="items">
                    {(provided) => (
                        <div
                            ref={(el) => {
                                containerRef.current = el;
                                provided.innerRef(el);
                            }}
                            {...provided.droppableProps}
                            className={styles.tableContainer}
                        >
                            {loading && items.length === 0 ? (
                                <div className={styles.loadingRow}>Загрузка...</div>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <Draggable
                                        key={item.id.toString()}
                                        draggableId={item.id.toString()}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`${styles.row} ${snapshot.isDragging ? styles.isDragging : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    className={styles.checkbox}
                                                />
                                                <span>Элемент #{item.value}</span>
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className={styles.dragHandle}
                                                    title="Перетащите для изменения порядка"
                                                >
                                                    ☰
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            )}
                            {provided.placeholder}
                            {loading && items.length > 0 && (
                                <div className={styles.loadingRow}>Загрузка дополнительных элементов...</div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
