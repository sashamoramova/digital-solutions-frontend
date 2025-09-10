import { useSelector, useDispatch } from 'react-redux';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { setSearchQuery, clearSearchQuery } from '@/app/slice/searchSlice';
import type { RootState } from '@/app/store/store';
import styles from './Header.module.css';

interface TableHeaderProps {
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function TableHeader({ onSelectAll, onClearSelection }: TableHeaderProps) {
  const dispatch = useDispatch();
  const searchQuery = useSelector((state: RootState) => state.search.searchQuery);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value));
  };

  return (
    <div className={styles.header}>
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <TextField
            variant="outlined"
            placeholder="Поиск..."
            size="small"
            className={styles.search}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => dispatch(clearSearchQuery())}
                  >
                    ✕
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </div>
        <button onClick={onSelectAll} className={styles.buttonFirst}>
          Выбрать все
        </button>
        <button onClick={onClearSelection} className={styles.buttonSecond}>
          Очистить выбор
        </button>
      </div>
    </div>
  );
}
