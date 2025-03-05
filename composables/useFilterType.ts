import { ref } from 'vue'

interface FilterType {
  label: string
  val: string
}

const filterType = ref<FilterType>({ label: 'NO FILTER', val: 'no-filter' });

export function useFilterType() {
  const setFilterType = (type: FilterType) => {
    filterType.value = type
  };

  return { filterType, setFilterType }
}