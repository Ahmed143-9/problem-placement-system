// src/utils/migration.js
export const migrateExistingProblems = () => {
  try {
    const problems = JSON.parse(localStorage.getItem('problems') || '[]');
    
    if (problems.length > 0 && problems[0].id > 10000) {
      console.log('✅ Problems already migrated to 5-digit IDs');
      return;
    }
    
    const migratedProblems = problems.map((problem, index) => ({
      ...problem,
      id: 10001 + index
    }));
    
    localStorage.setItem('problems', JSON.stringify(migratedProblems));
    console.log(`✅ Migrated ${migratedProblems.length} problems to 5-digit IDs`);
    return migratedProblems.length; // Return count for confirmation
  } catch (error) {
    console.error('❌ Migration error:', error);
    return 0;
  }
};