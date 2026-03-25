import numpy as np
import pandas as pd
import csv
import itertools

picks = pd.read_csv("picks2019worldsbest.csv", index_col=0)
master = pd.read_csv("masterbracket8teams.csv", index_col=0)
scenarios = pd.read_csv("scenario_pts_elite8_WB.csv")

#select subset of columns into a dataframe
#rank each cell in the row
#write that rank into a new dataframe
#write that dataframe to csv

startbracket = 63
bracketsEntered = 105
endingIndex = 15 + bracketsEntered

df = scenarios.iloc[:,15:endingIndex]

#print df

dfrank = df.T.rank(ascending=False)

ranks = dfrank.T

#print ranks

ranklist = {}

columns = ranks.columns.tolist()  #columns as bracket names


for column in columns:
  ranklist[column] = ranks[column].value_counts()

print ranklist

outputframe = pd.DataFrame(ranklist)

#print outputframe

outputframe.to_csv('output_ranks_8_WB.csv')

# now create a dataframe for the critical games analysis

gamesremaining = scenarios.iloc[:,:15]

critgames = pd.merge(gamesremaining, ranks, left_index=True, right_index=True)

critgames.to_csv('critgames8_WB.csv')

#resort the columns in the order of rank


print dfrank